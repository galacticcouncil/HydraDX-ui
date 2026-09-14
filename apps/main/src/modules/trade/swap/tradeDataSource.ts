import { PaperProps } from "@galacticcouncil/ui/components"
import { FC } from "react"

import { TradeOrders } from "@/modules/trade/orders/TradeOrders/TradeOrders"
import { TradeOrdersHistory } from "@/modules/trade/orders/TradeOrdersHistory"
import { SwapChart } from "@/modules/trade/swap/components/SwapChart/SwapChart"
import { TradeChartGrafana } from "@/modules/trade/swap/components/TradeChartGrafana/TradeChartGrafana"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIntentsStore } from "@/states/intents"
import { useNeckworkEnabled } from "@/states/neckwork"

export const useNeckworkTradeQueriesEnabled = (): boolean => {
  const isNeckworkEnabled = useNeckworkEnabled()
  const { isFork } = useRpcProvider()

  return isNeckworkEnabled && !isFork
}

export const useTradeDataSource = (): "neckwork" | "legacy" => {
  const neckworkEnabled = useNeckworkTradeQueriesEnabled()

  return neckworkEnabled ? "neckwork" : "legacy"
}

export const useTradeOrdersDataSource = (): "neckwork" | "legacy" => {
  const intentsEnabled = useIntentsStore((state) => state.enabled)
  const neckworkEnabled = useNeckworkTradeQueriesEnabled()

  if (intentsEnabled) return "legacy"

  return neckworkEnabled ? "neckwork" : "legacy"
}

export const TRADE_CHART_BY_SOURCE = {
  neckwork: SwapChart,
  legacy: TradeChartGrafana,
} as const satisfies Record<string, FC<{ readonly height: number }>>

export const TRADE_ORDERS_BY_SOURCE = {
  neckwork: TradeOrders,
  legacy: TradeOrdersHistory,
} as const satisfies Record<string, FC<PaperProps>>
