import { useAccount } from "@galacticcouncil/web3-connect"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { filter, merge, Observable } from "rxjs"

import { useAccountIntents } from "@/api/intents"
import { useObservable } from "@/hooks/useObservable"
import { useChainScheduleIds } from "@/modules/trade/orders/TradeOrders/lib/useChainOrdersData"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"

const INVALIDATE_DELAY = 5_000

type EventBatch<T> = {
  readonly events: ReadonlyArray<{ readonly payload: T }>
}

type EventWatcher<T> = {
  readonly watch: () => Observable<EventBatch<T>>
}

const ownedEvents = <T extends { readonly id: number | bigint }>(
  watcher: EventWatcher<T>,
  ids: () => ReadonlySet<string>,
): Observable<unknown> =>
  watcher
    .watch()
    .pipe(
      filter(({ events }) =>
        events.some(({ payload }) => ids().has(String(payload.id))),
      ),
    )

/** Invalidate order queries when ids change or an open order executes. Presence subscriptions miss executions. */
export const useInvalidateOrdersOnExecution = () => {
  const queryClient = useQueryClient()
  const { account } = useAccount()
  const { papi, isReady } = useRpcProvider()
  const isIceEnabled = useIsIceEnabled()

  const { scheduleIds, isLoading: isSchedulesLoading } = useChainScheduleIds()
  const { data: intents, isLoading: isIntentsLoading } = useAccountIntents(
    account?.address ?? "",
  )

  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const invalidate = useCallback(() => {
    if (timeout.current) return

    timeout.current = setTimeout(() => {
      timeout.current = null
      void queryClient.invalidateQueries({ queryKey: ["trade", "orders"] })
      void queryClient.invalidateQueries({ queryKey: ["intents", "values"] })
    }, INVALIDATE_DELAY)
  }, [queryClient])

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current)
    },
    [],
  )

  const scheduleKey = scheduleIds.join(",")
  const intentKey = intents.map(({ id }) => String(id)).join(",")

  const idsRef = useRef<{
    schedules: ReadonlySet<string>
    intents: ReadonlySet<string>
  }>({ schedules: new Set(), intents: new Set() })

  useEffect(() => {
    idsRef.current = {
      schedules: new Set(scheduleKey ? scheduleKey.split(",") : []),
      intents: new Set(intentKey ? intentKey.split(",") : []),
    }
  }, [scheduleKey, intentKey])

  const isLoading = isSchedulesLoading || isIntentsLoading
  const seenKey = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    const key = `${scheduleKey}|${intentKey}`

    if (seenKey.current !== null && seenKey.current !== key) invalidate()

    seenKey.current = key
  }, [isLoading, scheduleKey, intentKey, invalidate])

  const events$ = useMemo(() => {
    if (!isReady) return

    const { DCA, Intent } = papi.event

    const scheduleSet = () => idsRef.current.schedules
    const intentSet = () => idsRef.current.intents

    return merge(
      ownedEvents(DCA.TradeExecuted, scheduleSet),
      ownedEvents(DCA.TradeFailed, scheduleSet),
      ...(isIceEnabled
        ? [
            ownedEvents(Intent.DcaTradeExecuted, intentSet),
            ownedEvents(Intent.IntentResovedPartially, intentSet),
          ]
        : []),
    )
  }, [isReady, papi, isIceEnabled])

  useObservable(events$, { enabled: isReady, onUpdate: invalidate })
}
