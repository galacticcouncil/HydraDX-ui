import {
  migratedOrdersQuery,
  scheduledOrdersQuery,
} from "@galacticcouncil/indexer/indexer"
import { safeConvertSS58toPublicKey } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useIndexerClient } from "@/api/indexer"
import {
  buildMigratedScheduleHalves,
  mergeMigratedOrders,
  toMigrationLinks,
} from "@/modules/trade/orders/lib/buildOrderRows"
import { OrderData } from "@/modules/trade/orders/lib/orderData"
import { useDcaGrafanaEnrichment } from "@/modules/trade/orders/lib/useDcaGrafanaEnrichment"
import { useAssets } from "@/providers/assetsProvider"

export const useMigratedOrdersMerge = (orders: Array<OrderData>) => {
  const { account } = useAccount()
  const who = safeConvertSS58toPublicKey(account?.address ?? "")

  const indexerSdk = useIndexerClient()

  const { data: migratedData } = useQuery(migratedOrdersQuery(indexerSdk, who))
  const { data: scheduledData } = useQuery(
    scheduledOrdersQuery(indexerSdk, who),
  )

  const { getAssetWithFallback } = useAssets()

  const links = useMemo(
    () => toMigrationLinks(migratedData?.events ?? []),
    [migratedData],
  )

  const halves = useMemo(
    () =>
      buildMigratedScheduleHalves(
        scheduledData?.events ?? [],
        migratedData?.events ?? [],
        getAssetWithFallback,
      ),
    [scheduledData, migratedData, getAssetWithFallback],
  )

  const { orders: enrichedHalves } = useDcaGrafanaEnrichment(halves)

  const merged = useMemo(
    () => mergeMigratedOrders(orders, enrichedHalves, links),
    [orders, enrichedHalves, links],
  )

  return { orders: merged }
}
