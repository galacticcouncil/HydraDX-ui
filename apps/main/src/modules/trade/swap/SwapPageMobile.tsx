import { Flex, Separator } from "@galacticcouncil/ui/components"
import { Outlet } from "@tanstack/react-router"
import { FC } from "react"

import { FormHeader } from "@/modules/trade/swap/components/FormHeader/FormHeader"
import {
  TRADE_CHART_BY_SOURCE,
  TRADE_ORDERS_BY_SOURCE,
  useTradeDataSource,
  useTradeOrdersDataSource,
} from "@/modules/trade/swap/tradeDataSource"

import { SSwapFormContainer } from "./SwapPage.styled"

export const TRADE_CHART_MOBILE_HEIGHT = 300

export const SwapPageMobile: FC = () => {
  const chartSource = useTradeDataSource()
  const ordersSource = useTradeOrdersDataSource()
  const TradeChart = TRADE_CHART_BY_SOURCE[chartSource]
  const TradeOrders = TRADE_ORDERS_BY_SOURCE[ordersSource]

  return (
    <Flex direction="column" gap="xxl">
      <Flex direction="column" gap="base" width="100%">
        <SSwapFormContainer width="100%">
          <FormHeader />
          <Separator mx={-20} />
          <Outlet />
        </SSwapFormContainer>
      </Flex>
      <TradeChart height={TRADE_CHART_MOBILE_HEIGHT} />
      <TradeOrders />
    </Flex>
  )
}
