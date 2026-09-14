import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useMemo } from "react"

import { dcaAmountsQuery } from "@/api/grafana/dcaAmounts"
import { DcaOrderData } from "@/modules/trade/orders/lib/orderData"
import { scaleHuman } from "@/utils/formatting"

export const useDcaGrafanaEnrichment = (orders: Array<DcaOrderData>) => {
  const scheduleIds = useMemo(
    () => orders.map((order) => order.scheduleId),
    [orders],
  )

  const { data, refetch, isFetching } = useQuery(dcaAmountsQuery(scheduleIds))

  const enriched = useMemo(
    () =>
      orders.map((order) => {
        const amounts = data?.get(order.scheduleId)
        if (!amounts) return order

        const executedIn = scaleHuman(amounts.spent, order.from.decimals)
        const executedOut = scaleHuman(amounts.received, order.to.decimals)

        const fromAmountExecuted = Big.max(
          order.fromAmountExecuted ?? 0,
          executedIn,
        ).toString()

        return {
          ...order,
          fromAmountExecuted,
          fromAmountRemaining:
            order.isOpenBudget || order.fromAmountBudget === null
              ? order.fromAmountRemaining
              : Big.max(
                  0,
                  Big(order.fromAmountBudget).minus(fromAmountExecuted),
                ).toString(),
          toAmountExecuted: Big(executedOut).gt(0)
            ? executedOut
            : order.toAmountExecuted,
        }
      }),
    [orders, data],
  )

  return { orders: enriched, refetch, isFetching }
}
