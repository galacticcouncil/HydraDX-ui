import { useAccount } from "@galacticcouncil/web3-connect"
import { useMemo } from "react"

import { useAccountIntents } from "@/api/intents"
import { buildIntentOrderRows } from "@/modules/trade/orders/lib/buildOrderRows"
import { OrderData } from "@/modules/trade/orders/lib/orderData"
import { useAssets } from "@/providers/assetsProvider"
import { numericallyDesc } from "@/utils/sort"

export const useIntentOrdersData = () => {
  const { account } = useAccount()
  const { getAssetWithFallback } = useAssets()

  const { data: intents, isLoading } = useAccountIntents(account?.address ?? "")

  const orders = useMemo<OrderData[]>(() => {
    if (!intents) return []

    return buildIntentOrderRows(intents, getAssetWithFallback).sort((a, b) =>
      numericallyDesc(a.timestamp ?? 0, b.timestamp ?? 0),
    )
  }, [intents, getAssetWithFallback])

  return { orders, isLoading }
}
