import {
  ordersStatusQuery,
  scheduledOrdersQuery,
} from "@galacticcouncil/indexer/indexer"
import { safeConvertSS58toPublicKey } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useIndexerClient } from "@/api/indexer"
import { buildScheduleHistoryRows } from "@/modules/trade/orders/lib/buildOrderRows"
import { DcaOrderData } from "@/modules/trade/orders/lib/orderData"
import { useDcaGrafanaEnrichment } from "@/modules/trade/orders/lib/useDcaGrafanaEnrichment"
import { useAssets } from "@/providers/assetsProvider"

export const useTradeOrdersHistoryData = () => {
  const { account } = useAccount()
  const who = safeConvertSS58toPublicKey(account?.address ?? "")

  const indexerSdk = useIndexerClient()

  const { data: scheduledData, isLoading: isScheduledLoading } = useQuery(
    scheduledOrdersQuery(indexerSdk, who),
  )
  const { data: statusData, isLoading: isStatusLoading } = useQuery(
    ordersStatusQuery(indexerSdk, who),
  )

  const { getAssetWithFallback } = useAssets()

  const orders = useMemo<Array<DcaOrderData>>(
    () =>
      buildScheduleHistoryRows(
        scheduledData?.events ?? [],
        statusData?.events ?? [],
        getAssetWithFallback,
      ),
    [scheduledData, statusData, getAssetWithFallback],
  )

  const { orders: enrichedOrders } = useDcaGrafanaEnrichment(orders)

  return {
    orders: enrichedOrders,
    isLoading: isScheduledLoading || isStatusLoading,
  }
}
