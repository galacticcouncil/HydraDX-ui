import { useOmnipoolAssets } from "api/omnipool"
import { useTokenBalance } from "api/balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { useMemo } from "react"
import { BN_NAN } from "utils/constants"
import BN from "bignumber.js"
import { getFloatingPointAmount } from "utils/balance"
import { OmniMath } from "@galacticcouncil/sdk"
import { useAssets } from "providers/assets"

export const usePoolCapacity = (id: string) => {
  const { hub } = useAssets()

  const omnipoolAssets = useOmnipoolAssets()
  const hubBalance = useTokenBalance(hub.id, OMNIPOOL_ACCOUNT_ADDRESS)

  const queries = [omnipoolAssets, hubBalance]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (!omnipoolAssets.data || !hubBalance.data) return undefined

    const asset = omnipoolAssets.data.find(
      (a) => a.id.toString() === id.toString(),
    )

    if (!asset?.data || !hubBalance?.data)
      return {
        capacity: BN_NAN,
        filled: BN_NAN,
        filledPercent: BN_NAN,
        symbol: "N/a",
      }

    const symbol = asset.meta.symbol
    const assetReserve = asset.balance.toString()
    const assetHubReserve = asset.data.hubReserve.toString()
    const assetCap = asset.data.cap.toString()
    const totalHubReserve = hubBalance.data.total.toString()

    const capDifference = OmniMath.calculateCapDifference(
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
      asset.balance.plus(new BN(capDifference)),
      asset.meta.decimals,
    )
    const filled = getFloatingPointAmount(asset.balance, asset.meta.decimals)
    const filledPercent = filled.div(capacity).times(100)

    return { capacity, filled, filledPercent, symbol }
  }, [hubBalance.data, id, omnipoolAssets.data])

  return { data, isLoading }
}
