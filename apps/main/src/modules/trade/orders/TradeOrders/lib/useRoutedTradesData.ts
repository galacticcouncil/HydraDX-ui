import { routedTradesQuery } from "@galacticcouncil/indexer/neckwork"
import { neckwork } from "@galacticcouncil/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useMemo } from "react"

// `neckworkClient` is the Hydration Public API (hydration-api.neckwork.net);
// `neckwork` is the explorer url builder (hydration-explorer.neckwork.net).
import { neckworkClient } from "@/api/neckwork"
import {
  MarketSwapStatus,
  RoutedTradeData,
} from "@/modules/trade/orders/lib/types"
import { useNeckworkTradeQueriesEnabled } from "@/modules/trade/swap/tradeDataSource"
import { useAssets } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

const MARKET_STATUS: MarketSwapStatus = { kind: "market", status: "filled" }

export const useRoutedTradesData = (
  address: string,
  assetIds: Array<string>,
  page: number,
  pageSize: number,
) => {
  const neckworkEnabled = useNeckworkTradeQueriesEnabled()

  const { data, isLoading } = useQuery({
    ...routedTradesQuery(neckworkClient, {
      account: address,
      assetIds,
      page,
      pageSize,
    }),
    enabled: neckworkEnabled && !!address,
    placeholderData: keepPreviousData,
  })

  const { getAssetWithFallback } = useAssets()

  const totalCount = data?.totalCount ?? 0
  const swaps = useMemo<Array<RoutedTradeData>>(() => {
    return (
      data?.items.map<RoutedTradeData>((trade) => {
        const from = getAssetWithFallback(trade.assetIn)
        const to = getAssetWithFallback(trade.assetOut)
        const fromAmount = scaleHuman(trade.amountIn || "0", from.decimals)
        const toAmount = scaleHuman(trade.amountOut || "0", to.decimals)
        const fillPrice = Big(toAmount).gt(0)
          ? Big(fromAmount).div(toAmount).toString()
          : "0"

        const link =
          typeof trade.extrinsicIndex === "number"
            ? neckwork.activityExtrinsic(
                "swap",
                trade.blockHeight,
                trade.extrinsicIndex,
              )
            : neckwork.event(trade.blockHeight, trade.eventIndex)

        return {
          from,
          fromAmount,
          to,
          toAmount,
          fillPrice,
          date: new Date(trade.timestamp),
          link,
          status: MARKET_STATUS,
        }
      }) ?? []
    )
  }, [data, getAssetWithFallback])

  return { swaps, totalCount, isLoading }
}
