import { useAccount } from "@galacticcouncil/web3-connect"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { secondsToMilliseconds } from "date-fns"
import { useMemo } from "react"

import { usePapiEntries } from "@/hooks/usePapiEntries"
import {
  DcaOrderData,
  OrderKind,
  OrderStatus,
} from "@/modules/trade/orders/lib/orderData"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { scaleHuman } from "@/utils/formatting"

const CHAIN_ORDERS_STALE_TIME = secondsToMilliseconds(30)

export const useChainScheduleIds = () => {
  const { account } = useAccount()
  const { isReady } = useRpcProvider()

  const address = account?.address ?? ""
  const enabled = isReady && !!address

  const { data: entries, isLoading } = usePapiEntries(
    "DCA.ScheduleOwnership",
    [address],
    {
      enabled,
      staleTime: CHAIN_ORDERS_STALE_TIME,
      refetchOnWindowFocus: true,
    },
  )

  const scheduleIds = useMemo(
    () =>
      (entries ?? []).map(({ keyArgs }) => keyArgs[1]).sort((a, b) => b - a),
    [entries],
  )

  return { scheduleIds, isLoading }
}

export const useChainOrdersData = () => {
  const { papi } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()

  const { scheduleIds, isLoading: isEntriesLoading } = useChainScheduleIds()

  const { data, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ["trade", "orders", "chain", scheduleIds],
    queryFn: async () => {
      const { DCA } = papi.query
      const keys = scheduleIds.map((id): [number] => [id])

      const [schedules, remainingAmounts] = await Promise.all([
        DCA.Schedules.getValues(keys, { at: "best" }),
        DCA.RemainingAmounts.getValues(keys, { at: "best" }),
      ])

      return scheduleIds.map((scheduleId, index) => ({
        scheduleId,
        schedule: schedules[index],
        remaining: remainingAmounts[index] ?? null,
      }))
    },
    enabled: scheduleIds.length > 0,
    staleTime: CHAIN_ORDERS_STALE_TIME,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })

  const openScheduleIds = useMemo(() => new Set(scheduleIds), [scheduleIds])

  const orders = useMemo<Array<DcaOrderData>>(
    () =>
      (data ?? []).flatMap<DcaOrderData>(
        ({ scheduleId, schedule, remaining }) => {
          if (!schedule || !openScheduleIds.has(scheduleId)) return []

          const { order } = schedule
          const from = getAssetWithFallback(String(order.value.asset_in))
          const to = getAssetWithFallback(String(order.value.asset_out))

          const singleTradeAmount =
            order.type === "Sell"
              ? order.value.amount_in
              : order.value.max_amount_in

          const isOpenBudget = schedule.total_amount === 0n
          const hasBudget = !isOpenBudget && remaining !== null

          return [
            {
              kind: isOpenBudget ? OrderKind.DcaRolling : OrderKind.Dca,
              scheduleId,
              from,
              fromAmountBudget: isOpenBudget
                ? null
                : scaleHuman(schedule.total_amount, from.decimals),
              fromAmountExecuted: hasBudget
                ? scaleHuman(schedule.total_amount - remaining, from.decimals)
                : null,
              fromAmountRemaining: hasBudget
                ? scaleHuman(remaining, from.decimals)
                : null,
              singleTradeSize: scaleHuman(singleTradeAmount, from.decimals),
              to,
              toAmountExecuted: null,
              status: OrderStatus.Created,
              blocksPeriod: String(schedule.period),
              isOpenBudget,
              timestamp: null,
              limitPrice: null,
            },
          ]
        },
      ),
    [data, openScheduleIds, getAssetWithFallback],
  )

  const isLoading =
    (isEntriesLoading || isSchedulesLoading) && orders.length === 0

  return { orders, isLoading }
}
