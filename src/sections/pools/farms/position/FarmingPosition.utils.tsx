import BN from "bignumber.js"
import { TDeposit, useAccountPositions } from "api/deposits"
import { useMemo } from "react"
import { TLPData, useLiquidityPositionData } from "utils/omnipool"
import { BN_0 } from "utils/constants"
import { useSDKPools, useShareOfPools } from "api/pools"
import { useDisplayShareTokenPrice } from "utils/displayAsset"
import { TShareToken, useAssets } from "providers/assets"
import { scaleHuman } from "utils/balance"

type TokenAmount = {
  id: string
  symbol: string
  decimals: number
  amount: BN
}

export type TOmniDepositData = TLPData & { depositId: string }

export type TXYKDepositData = {
  assetA: TokenAmount
  assetB: TokenAmount
  amountUSD: BN
  assetId: string
  depositId: string
}

export type TDepositData = TOmniDepositData | TXYKDepositData

export const isXYKDeposit = (
  deposit: TDepositData,
): deposit is TXYKDepositData => "amountUSD" in deposit

export const useAllOmnipoolDeposits = (address?: string) => {
  const { depositLiquidityPositions = [] } =
    useAccountPositions(address).data ?? {}
  const { getData } = useLiquidityPositionData()

  const data = useMemo(
    () =>
      depositLiquidityPositions.reduce<Record<string, Array<TOmniDepositData>>>(
        (memo, position) => {
          const positionData = getData(position)

          if (positionData) {
            const index = position.assetId

            memo[index] = [
              ...(memo[index] ?? []),
              {
                ...positionData,
                depositId: position.depositId,
              },
            ]
          }

          return memo
        },
        {},
      ),

    [getData, depositLiquidityPositions],
  )

  return data
}

export const useAllXYKDeposits = (address?: string) => {
  const { xykDeposits = [] } = useAccountPositions(address).data ?? {}
  const { getShareTokenByAddress } = useAssets()

  const depositNftsData = xykDeposits.reduce<
    { asset: TShareToken; depositNft: TDeposit }[]
  >((acc, depositNft) => {
    const asset = getShareTokenByAddress(depositNft.data.ammPoolId.toString())

    if (asset)
      acc.push({
        asset,
        depositNft,
      })
    return acc
  }, [])

  const uniqAssetIds = [
    ...new Set(depositNftsData.map((deposit) => deposit.asset.id)),
  ]
  const totalIssuances = useShareOfPools(uniqAssetIds)
  const shareTokeSpotPrices = useDisplayShareTokenPrice(uniqAssetIds)
  const pools = useSDKPools()

  const isLoading =
    pools.isInitialLoading ||
    totalIssuances.isInitialLoading ||
    shareTokeSpotPrices.isInitialLoading

  const data = useMemo(
    () =>
      depositNftsData.reduce<Record<string, Array<TXYKDepositData>>>(
        (acc, deposit) => {
          const { asset, depositNft } = deposit
          const shareTokenIssuance = totalIssuances.data?.find(
            (totalIssuance) => totalIssuance.asset === asset.id,
          )?.totalShare

          const pool = pools.data?.find(
            (pool) => pool.address === asset.poolAddress,
          )

          if (shareTokenIssuance && pool) {
            const index = asset.id
            const shares = depositNft.data.shares.toBigNumber()
            const ratio = shares.div(shareTokenIssuance)
            const amountUSD = scaleHuman(shareTokenIssuance, asset.decimals)
              .multipliedBy(shareTokeSpotPrices.data?.[0]?.spotPrice ?? 1)
              .times(ratio)

            const [assetA, assetB] = pool.tokens.map((token) => {
              const amount = scaleHuman(
                BN(token.balance).times(ratio),
                token.decimals,
              )

              return {
                id: token.id,
                symbol: token.symbol,
                decimals: token.decimals,
                amount,
              }
            })

            acc[index] = [
              ...(acc[index] ?? []),
              {
                assetA,
                assetB,
                amountUSD,
                assetId: asset.id,
                depositId: depositNft.id,
              },
            ]
          }

          return acc
        },
        {},
      ),
    [
      depositNftsData,
      pools.data,
      shareTokeSpotPrices.data,
      totalIssuances.data,
    ],
  )

  return { data, isLoading }
}

export const useAllFarmDeposits = (address?: string) => {
  const omnipoolDepositValues = useAllOmnipoolDeposits(address)
  const xykDepositValues = useAllXYKDeposits(address)

  const isLoading = xykDepositValues.isLoading

  return {
    isLoading,
    omnipool: omnipoolDepositValues,
    xyk: xykDepositValues.data,
  }
}

export const useFarmDepositsTotal = (address?: string) => {
  const { isLoading, omnipool, xyk } = useAllFarmDeposits(address)

  const total = useMemo(() => {
    let poolsTotal = BN_0

    for (const poolId in omnipool) {
      const poolTotal = omnipool[poolId].reduce((memo, share) => {
        return memo.plus(share.valueDisplay)
      }, BN_0)
      poolsTotal = poolsTotal.plus(poolTotal)
    }

    for (const id in xyk) {
      const xykTotal = xyk[id].reduce((memo, deposit) => {
        if (deposit.amountUSD) return memo.plus(deposit.amountUSD)
        return memo
      }, BN_0)
      poolsTotal.plus(xykTotal)
    }

    return poolsTotal
  }, [omnipool, xyk])

  return { isLoading: isLoading, value: total }
}
