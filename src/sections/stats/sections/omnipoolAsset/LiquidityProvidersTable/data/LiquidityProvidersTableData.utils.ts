import { useAssets } from "providers/assets"
import { useAllLiquidityPositions, useOmnipoolAssets } from "api/omnipool"
import { useTVL } from "api/stats"
import BN from "bignumber.js"
import { useMemo } from "react"
import { BN_NAN } from "utils/constants"
import { isNotNil } from "utils/helpers"
import { useLiquidityPositionData } from "utils/omnipool"
import { groupBy } from "utils/rx"

const rowLimit = 10

export const useLiquidityProvidersTableData = (assetId: string) => {
  const { getAsset } = useAssets()

  const positions = useAllLiquidityPositions()

  const omnipoolAssets = useOmnipoolAssets()
  const omnipoolAsset = omnipoolAssets.data?.find(
    (omnipoolAsset) => omnipoolAsset.id === assetId,
  )

  const { getData } = useLiquidityPositionData([assetId])

  const tvl = useTVL(assetId)

  const queries = [positions, omnipoolAssets, tvl]

  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    const meta = getAsset(assetId)

    if (!positions.data || !omnipoolAsset || !meta) {
      return []
    }

    const omnipoolTvlPrice = BN(tvl.data?.[0]?.tvl_usd ?? BN_NAN)

    const data = positions.data

      // filter positions by assetId
      .filter((position) => position.assetId === assetId)
      .map((position) => {
        const data = getData({ ...position, id: "" })

        if (data) {
          const {
            lrnaShifted,
            valueShifted,
            valueDisplay,
            valueDisplayWithoutLrna,
            totalValueShifted,
          } = data

          return {
            assetId: meta.id,
            symbol: meta.symbol,
            account: position.owner,
            sharePercent: omnipoolTvlPrice.isNaN()
              ? BN_NAN
              : valueDisplayWithoutLrna.div(omnipoolTvlPrice).times(100),
            lrna: lrnaShifted,
            value: valueShifted,
            valueDisplay,
            totalValueShifted,
          }
        }

        return undefined
      })
      .filter(isNotNil)

    // group by account
    const groupedData = groupBy(data, (p) => p.account.toString())

    // sum up values for each account
    const summedUpData = Object.values(groupedData).map((positions) =>
      positions.reduce(
        (prev, curr) => {
          const lrna = prev.lrna.plus(curr.lrna)
          const value = prev.value.plus(curr.value)
          const valueDisplay = prev.valueDisplay.plus(curr.valueDisplay)
          const sharePercent = prev.sharePercent.plus(curr.sharePercent)
          const totalValueShifted = prev.totalValueShifted.plus(
            curr.totalValueShifted,
          )

          return {
            ...prev,
            ...curr,
            lrna,
            value,
            valueDisplay,
            sharePercent,
            totalValueShifted,
          }
        },
        {
          assetId: "",
          symbol: "",
          account: "",
          lrna: BN(0),
          value: BN(0),
          valueDisplay: BN(0),
          sharePercent: BN(0),
          totalValueShifted: BN(0),
        },
      ),
    )

    // sort by USD value
    const sortedData = [...summedUpData].sort((a, b) => {
      return b.valueDisplay.minus(a.valueDisplay).toNumber()
    })

    return sortedData.slice(0, rowLimit)
  }, [assetId, getAsset, getData, omnipoolAsset, positions.data, tvl.data])

  return { isLoading, data }
}

export type TLiquidityProvidersTableData = ReturnType<
  typeof useLiquidityProvidersTableData
>["data"]
