import { intentEventsQuery } from "@galacticcouncil/indexer/indexer"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useIndexerClient } from "@/api/indexer"
import {
  enrichIntentOrders,
  sumIntentFills,
} from "@/modules/trade/orders/lib/buildOrderRows"
import { isIntentOrder, OrderData } from "@/modules/trade/orders/lib/orderData"

export const useIntentFillEnrichment = (orders: Array<OrderData>) => {
  const indexerSdk = useIndexerClient()

  const ids = useMemo(
    () => orders.filter(isIntentOrder).map((order) => String(order.intentId)),
    [orders],
  )

  const { data, refetch, isFetching } = useQuery(
    intentEventsQuery(indexerSdk, ids),
  )

  const enriched = useMemo(
    () =>
      data ? enrichIntentOrders(orders, sumIntentFills(data.events)) : orders,
    [orders, data],
  )

  return { orders: enriched, refetch, isFetching }
}
