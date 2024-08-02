import {
  calculate_liquidity_hub_in,
  calculate_shares,
  verify_asset_cap,
} from "@galacticcouncil/math-omnipool"
import { u32 } from "@polkadot/types"
import { useTokenBalance } from "api/balances"
import { useMaxAddLiquidityLimit } from "api/consts"
import { useOmnipoolAssets, useOmnipoolFee } from "api/omnipool"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { getFixedPointAmount } from "utils/balance"
import { BN_10 } from "utils/constants"
import { useDisplayPrice } from "utils/displayAsset"
import { useAssets } from "providers/assets"
import { usePoolData } from "sections/pools/pool/Pool"

export const useAddLiquidity = (assetId: u32 | string, assetValue?: string) => {
  const omnipoolAssets = useOmnipoolAssets()
  const { pool } = usePoolData()
  const ommipoolAsset = omnipoolAssets.data?.find(
    (omnipoolAsset) => omnipoolAsset.id.toString() === assetId,
  )

  const { data: spotPrice } = useDisplayPrice(assetId)

  const { data: omnipoolFee } = useOmnipoolFee()

  const { account } = useAccount()
  const { data: assetBalance } = useTokenBalance(assetId, account?.address)

  const poolShare = useMemo(() => {
    if (ommipoolAsset && assetValue) {
      const {
        data: { hubReserve, shares },
        balance,
      } = ommipoolAsset

      const assetReserve = balance.toString()
      const amount = BigNumber(assetValue)
        .multipliedBy(BN_10.pow(pool.meta.decimals))
        .toString()

      if (assetReserve && hubReserve && shares && amount) {
        const calculatedShares = calculate_shares(
          assetReserve,
          hubReserve.toString(),
          shares.toString(),
          amount,
        )

        const totalShares = shares.toBigNumber().plus(calculatedShares)
        const diff = BigNumber(calculatedShares).div(totalShares).times(100)

        return diff
      }
    }
    return null
  }, [assetValue, ommipoolAsset, pool.meta.decimals])

  return {
    poolShare,
    spotPrice,
    omnipoolFee,
    assetMeta: pool.meta,
    assetBalance,
  }
}

export const useVerifyLimits = ({
  assetId,
  amount,
  decimals,
}: {
  assetId: string
  amount: string
  decimals: number
}) => {
  const { hub } = useAssets()
  const omnipoolAssets = useOmnipoolAssets()
  const asset = omnipoolAssets.data?.find(
    (omnipoolAsset) => omnipoolAsset.id.toString() === assetId,
  )
  const hubBalance = useTokenBalance(hub.id, OMNIPOOL_ACCOUNT_ADDRESS)

  const maxAddLiquidityLimit = useMaxAddLiquidityLimit()

  const queries = [hubBalance, maxAddLiquidityLimit]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (!asset || !hubBalance.data || !amount || !maxAddLiquidityLimit.data)
      return undefined
    const assetMeta = asset.meta
    const assetReserve = asset.balance.toString()
    const assetHubReserve = asset.data.hubReserve.toString()
    const assetShares = asset.data.shares.toString()
    const assetCap = asset.data.cap.toString()
    const totalHubReserve = hubBalance.data.total.toString()
    const amountIn = getFixedPointAmount(amount, decimals).toFixed(0)
    const circuitBreakerLimit = maxAddLiquidityLimit.data
      .multipliedBy(assetReserve)
      .div(BN_10.pow(assetMeta.decimals))
      .toFixed(4)
    const isWithinCircuitBreakerLimit =
      BigNumber(circuitBreakerLimit).gte(amount)

    const hubIn = calculate_liquidity_hub_in(
      assetReserve,
      assetHubReserve,
      assetShares,
      amountIn,
    )

    const isWithinLimit = verify_asset_cap(
      assetHubReserve,
      assetCap,
      hubIn,
      totalHubReserve,
    )

    return {
      cap: isWithinLimit,
      circuitBreaker: {
        isWithinLimit: isWithinCircuitBreakerLimit,
        maxValue: circuitBreakerLimit,
      },
    }
  }, [asset, hubBalance.data, amount, decimals, maxAddLiquidityLimit.data])

  return { data, isLoading }
}
