import { queryOptions } from "@tanstack/react-query"

import { IndexerSdk } from "@/indexer"

export const scheduledOrdersQuery = (indexerSdk: IndexerSdk, who: string) =>
  queryOptions({
    queryKey: ["trade", "orders", "ScheduledOrders", who],
    queryFn: () => indexerSdk.ScheduledOrders({ who }),
    enabled: !!who,
  })

export const ordersStatusQuery = (indexerSdk: IndexerSdk, who: string) =>
  queryOptions({
    queryKey: ["trade", "orders", "OrdersStatus", who],
    queryFn: () => indexerSdk.OrdersStatus({ who }),
    enabled: !!who,
  })

export const migratedOrdersQuery = (indexerSdk: IndexerSdk, who: string) =>
  queryOptions({
    queryKey: ["trade", "orders", "MigratedOrders", who],
    queryFn: () => indexerSdk.MigratedOrders({ who }),
    enabled: !!who,
  })

export const orderTradesQuery = (indexerSdk: IndexerSdk, id: number) =>
  queryOptions({
    queryKey: ["trade", "orders", "OrderTrades", id],
    queryFn: () => indexerSdk.OrderTrades({ id }),
    enabled: !!id,
  })

export const intentsSubmittedQuery = (
  indexerSdk: IndexerSdk,
  owner: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
) =>
  queryOptions({
    queryKey: ["trade", "orders", "IntentsSubmitted", owner, limit, offset],
    queryFn: () => indexerSdk.IntentsSubmitted({ owner, limit, offset }),
    enabled: !!owner,
  })

export const intentEventsQuery = (indexerSdk: IndexerSdk, ids: string[]) =>
  queryOptions({
    queryKey: ["trade", "orders", "IntentEvents", ids],
    queryFn: () =>
      indexerSdk.IntentEvents({
        idFilters: ids.map((id) => ({ args_jsonContains: { id } })),
      }),
    enabled: ids.length > 0,
  })
