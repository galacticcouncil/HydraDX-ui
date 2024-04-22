import { useApiIds } from "api/consts"
import { useOmnipoolAssets } from "api/omnipool"
import { useTokensBalances } from "api/balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { useMemo } from "react"
import { BN_NAN } from "utils/constants"
import BN, { BigNumber } from "bignumber.js"
import { getFloatingPointAmount } from "utils/balance"
import { useRpcProvider } from "providers/rpcProvider"
import { useDisplayAssetStore } from "utils/displayAsset"
import { OmniMath } from "@galacticcouncil/sdk"

function calculateCapDifference(
  assetReserve: string,
  assetHubReserve: string,
  assetCap: string,
  totalHubReserve: string,
): string {
  const qi = BigNumber(assetHubReserve)
  const ri = BigNumber(assetReserve)
  const q = BigNumber(totalHubReserve)
  const omegaI = BigNumber(assetCap)

  const percentage = omegaI.shiftedBy(-18)
  const isUnderWeightCap = qi.div(q).lt(percentage)

  if (isUnderWeightCap) {
    const numerator = percentage.times(q).minus(qi).times(ri)
    const denominator = qi.times(BigNumber(1).minus(percentage))
    return numerator.div(denominator).toFixed(0)
  } else {
    return "0"
  }
}

export const usePoolCapacity = (id: string) => {
  const { assets } = useRpcProvider()
  const { stableCoinId } = useDisplayAssetStore()

  const apiIds = useApiIds()
  const omnipoolAssets = useOmnipoolAssets()
  const balances = useTokensBalances(
    [apiIds.data?.hubId ?? "", stableCoinId ?? "", id],
    OMNIPOOL_ACCOUNT_ADDRESS,
  )
  const meta = assets.getAsset(id.toString())

  const queries = [apiIds, omnipoolAssets, ...balances]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (!apiIds.data || !omnipoolAssets.data || balances.some((q) => !q.data))
      return undefined

    const asset = omnipoolAssets.data.find(
      (a) => a.id.toString() === id.toString(),
    )

    const assetBalance = balances.find(
      (b) => b.data?.assetId.toString() === id.toString(),
    )
    const hubBalance = balances.find(
      (b) => b.data?.assetId.toString() === apiIds.data.hubId.toString(),
    )
    const usdBalance = balances.find(
      (b) => b.data?.assetId.toString() === stableCoinId,
    )
    const symbol = meta.symbol

    if (
      !asset?.data ||
      !assetBalance?.data ||
      !hubBalance?.data ||
      !usdBalance?.data
    )
      return {
        capacity: BN_NAN,
        filled: BN_NAN,
        filledPercent: BN_NAN,
        symbol,
      }

    const assetReserve = assetBalance.data.balance.toString()
    const assetHubReserve = asset.data.hubReserve.toString()
    const assetCap = asset.data.cap.toString()
    const totalHubReserve = hubBalance.data.total.toString()

    const capDifference = calculateCapDifference(
      assetReserve,
      assetHubReserve,
      assetCap,
      totalHubReserve,
    )

    if (capDifference === "-1")
      return {
        capacity: BN_NAN,
        filled: BN_NAN,
        filledPercent: BN_NAN,
        symbol,
      }

    const capacity = getFloatingPointAmount(
      assetBalance.data.balance.plus(new BN(capDifference)),
      meta.decimals,
    )
    const filled = getFloatingPointAmount(
      assetBalance.data.balance,
      meta.decimals,
    )
    const filledPercent = filled.div(capacity).times(100)

    return { capacity, filled, filledPercent, symbol }
  }, [
    apiIds.data,
    omnipoolAssets.data,
    balances,
    meta.symbol,
    meta.decimals,
    id,
    stableCoinId,
  ])

  return { data, isLoading }
}
