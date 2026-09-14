import {
  intentEventsQuery,
  intentsSubmittedQuery,
} from "@galacticcouncil/indexer/indexer"
import { safeConvertSS58toPublicKey } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { isNonNullish } from "remeda"

import { useIndexerClient } from "@/api/indexer"
import { buildIntentHistoryRows } from "@/modules/trade/orders/lib/buildOrderRows"
import { OrderData } from "@/modules/trade/orders/lib/orderData"
import { useAssets } from "@/providers/assetsProvider"

export const useIntentOrdersHistoryData = () => {
  const { account } = useAccount()
  const owner = safeConvertSS58toPublicKey(account?.address ?? "")

  const indexerSdk = useIndexerClient()

  const { data: submitted, isLoading: isSubmittedLoading } = useQuery(
    intentsSubmittedQuery(indexerSdk, owner),
  )

  const ids = useMemo(
    () =>
      (submitted?.events ?? [])
        .map((event) => (event.args as { id?: string } | null)?.id)
        .filter(isNonNullish),
    [submitted],
  )

  const { data: followUps, isLoading: isFollowUpsLoading } = useQuery(
    intentEventsQuery(indexerSdk, ids),
  )

  const { getAssetWithFallback } = useAssets()

  const orders = useMemo<Array<OrderData>>(
    () =>
      buildIntentHistoryRows(
        submitted?.events ?? [],
        followUps?.events ?? [],
        getAssetWithFallback,
      ),
    [submitted, followUps, getAssetWithFallback],
  )

  return { orders, isLoading: isSubmittedLoading || isFollowUpsLoading }
}
