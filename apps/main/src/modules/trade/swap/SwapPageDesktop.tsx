import { Flex, Separator, Stack } from "@galacticcouncil/ui/components"
import { Outlet } from "@tanstack/react-router"

import { TwoColumnGrid } from "@/modules/layout/components/TwoColumnGrid/TwoColumnGrid"
import { FormHeader } from "@/modules/trade/swap/components/FormHeader/FormHeader"
import { PageHeader } from "@/modules/trade/swap/components/PageHeader/PageHeader"
import {
  TRADE_CHART_BY_SOURCE,
  TRADE_ORDERS_BY_SOURCE,
  useTradeDataSource,
  useTradeOrdersDataSource,
} from "@/modules/trade/swap/tradeDataSource"

import { SSwapFormContainer } from "./SwapPage.styled"

export const TRADE_CHART_DESKTOP_HEIGHT = 460

export const SwapPageDesktop = () => {
  const chartSource = useTradeDataSource()
  const ordersSource = useTradeOrdersDataSource()
  const TradeChart = TRADE_CHART_BY_SOURCE[chartSource]
  const TradeOrders = TRADE_ORDERS_BY_SOURCE[ordersSource]

  return (
    <Stack gap="xl">
      <PageHeader />
      <TwoColumnGrid template="sidebar" sx={{ gridTemplateRows: "auto 1fr" }}>
        <TradeChart height={TRADE_CHART_DESKTOP_HEIGHT} />
        <Flex
          direction="column"
          gap="base"
          width="100%"
          minWidth={0}
          gridColumn={2}
          gridRow={[null, null, null, "1/-1"]}
          sx={{ alignSelf: "stretch" }}
        >
          <SSwapFormContainer width="100%">
            <FormHeader />
            <Separator mx="-xl" />
            <Outlet />
          </SSwapFormContainer>
        </Flex>
        <TradeOrders gridColumn={[null, null, "1/-1", "1"]} />
      </TwoColumnGrid>
    </Stack>
  )
}
