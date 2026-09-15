import { uniswapV3VolumeQuery } from "@galacticcouncil/indexer/neckwork"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useMemo } from "react"

import { useVaultShares, useVaultStates, VaultState } from "@/api/gamma/vaults"
import { neckworkClient } from "@/api/neckwork"
import { useV3PoolMetrics, useV3Pools, V3PoolBase } from "@/api/pools"
import { TAsset, useAssets } from "@/providers/assetsProvider"
import { useAssetsPrice } from "@/states/displayAsset"
import { scaleHuman } from "@/utils/formatting"

export type VaultTable = {
  id: string
  pool: V3PoolBase
  tokens: [TAsset, TAsset]
  feeTier: number
  /** Deposited value of the pool, at what its contract actually holds. */
  tvlDisplay: string | undefined
  volumeDisplay: string | undefined
  /**
   * Annualised pool fee APR in percent units: the LPs' share of the last 24
   * hours of fees, over what the pool holds.
   */
  apr: string | undefined
  isVolumeLoading: boolean
  price: string | undefined
  vault: VaultState | null
  status: VaultStatus
  vaultTvlDisplay: string | undefined
  canDeposit: boolean
  positionShares: bigint
  positionValueDisplay: string | undefined
}

export type VaultStatus =
  | "noVault"
  | "notStarted"
  | "depositsClosed"
  | "empty"
  | "inRange"
  | "outOfRange"

export const useVaults = () => {
  const { data: pools, isLoading } = useV3Pools()
  const { getAssetWithFallback } = useAssets()
  const { data: vaults, isLoading: isVaultLoading } = useVaultStates(
    pools ?? [],
  )
  const sharesQuery = useVaultShares(vaults)
  const shares = sharesQuery.data

  const { data: volumes, isLoading: isVolumeLoading } = useQuery(
    uniswapV3VolumeQuery(neckworkClient),
  )

  // What each pool actually holds, and the part of its fees LPs keep.
  const { data: metrics, isLoading: isMetricsLoading } = useV3PoolMetrics(
    pools ?? [],
  )

  const assetIds = useMemo(
    () =>
      Array.from(
        new Set(
          (pools ?? []).flatMap((pool) => [
            pool.token0.toString(),
            pool.token1.toString(),
          ]),
        ),
      ),
    [pools],
  )

  const { getAssetPrice } = useAssetsPrice(assetIds)

  const data = useMemo<VaultTable[]>(() => {
    if (!pools?.length) return []

    return pools.map((pool, index) => {
      const vault = vaults[index] ?? null
      const token0 = getAssetWithFallback(pool.token0.toString())
      const token1 = getAssetWithFallback(pool.token1.toString())

      // Deposited value, from what the pool contract holds. Not `pool.tokens`:
      // those balances are the SDK's VIRTUAL reserves (the depth the active
      // liquidity offers at the current price), so in a concentrated pool they
      // run well above the money actually in it.
      const poolMetrics = metrics[index]
      const tvlDisplay = poolMetrics
        ? [
            { id: pool.token0, amount: poolMetrics.reserve0 },
            { id: pool.token1, amount: poolMetrics.reserve1 },
          ]
            .reduce((total, { id, amount }) => {
              const price = getAssetPrice(id.toString())
              if (!price?.isValid) return total

              const meta = getAssetWithFallback(id.toString())

              return total.plus(
                Big(scaleHuman(amount, meta.decimals)).times(price.price),
              )
            }, Big(0))
            .toString()
        : undefined

      // 24h volume and the fees it paid, from neckwork, keyed by pool contract.
      // The APR annualises the LPs' share of those fees over what the pool
      // holds, the way every other concentrated-liquidity UI states a pool APR.
      // A pool that saw no swaps is absent from the feed rather than zeroed, so
      // it only reads as unknown while the feed itself is missing.
      const volume = volumes?.find(
        (entry) => entry.address === pool.address.toLowerCase(),
      )
      const volumeDisplay = volumes ? (volume?.volumeUsd ?? "0") : undefined
      const feesDisplay = volumes ? (volume?.feeUsd ?? "0") : undefined
      const apr =
        feesDisplay !== undefined &&
        poolMetrics &&
        tvlDisplay &&
        Big(tvlDisplay).gt(0)
          ? Big(feesDisplay)
              .times(poolMetrics.lpFeeShare)
              .times(365)
              .div(tvlDisplay)
              .times(100)
              .toString()
          : undefined

      const raw = Big(pool.sqrtPriceX96.toString()).pow(2).div(Big(2).pow(192))
      const price = raw
        .times(Big(10).pow(token0.decimals - token1.decimals))
        .toString()

      const vaultTvlDisplay = vault
        ? [
            { id: pool.token0, amount: vault.total0 },
            { id: pool.token1, amount: vault.total1 },
          ]
            .reduce((total, { id, amount }) => {
              const assetPrice = getAssetPrice(id.toString())
              if (!assetPrice?.isValid) return total

              const meta = getAssetWithFallback(id.toString())

              return total.plus(
                Big(scaleHuman(amount, meta.decimals)).times(assetPrice.price),
              )
            }, Big(0))
            .toString()
        : undefined

      const status = getVaultStatus(pool, vault)

      const positionShares = shares[index] ?? 0n
      const positionValueDisplay =
        vault && vaultTvlDisplay && vault.totalSupply > 0n
          ? Big(vaultTvlDisplay)
              .times(positionShares.toString())
              .div(vault.totalSupply.toString())
              .toString()
          : undefined
      return {
        id: pool.address,
        pool,
        tokens: [token0, token1],
        feeTier: pool.fee,
        tvlDisplay,
        volumeDisplay,
        apr,
        isVolumeLoading,
        price,
        vault,
        status,
        vaultTvlDisplay,
        canDeposit: status === "empty" || status === "inRange",
        positionShares,
        positionValueDisplay,
      }
    })
  }, [
    pools,
    vaults,
    shares,
    volumes,
    metrics,
    isVolumeLoading,
    getAssetWithFallback,
    getAssetPrice,
  ])

  return {
    data,
    isLoading: isLoading || isVaultLoading || isMetricsLoading,
    isPositionError: sharesQuery.isError,
    isDisconnected: sharesQuery.isDisconnected,
  }
}

const getVaultStatus = (
  pool: V3PoolBase,
  vault: VaultState | null,
): VaultStatus => {
  if (!vault) return "noVault"

  const hasPosition = vault.baseLower !== 0 || vault.baseUpper !== 0
  if (!hasPosition) return "notStarted"

  if (vault.whitelisted.toLowerCase() !== vault.uniProxy.toLowerCase())
    return "depositsClosed"

  if (pool.tick < vault.baseLower || pool.tick >= vault.baseUpper)
    return "outOfRange"

  if (vault.totalSupply === 0n) return "empty"

  return "inRange"
}

export const feeTierPercent = (fee: number) => fee / 10_000
