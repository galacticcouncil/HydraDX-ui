import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { usePapiEntries } from "@/hooks/usePapiEntries"
import { Papi, TProviderContext, useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"

type IntentValue = NonNullable<
  Awaited<ReturnType<Papi["query"]["Intent"]["Intents"]["getValue"]>>
>

export type AccountIntentEntry = {
  id: bigint
  intent: IntentValue
}

const useAccountIntentIds = (address: string) => {
  const { isReady } = useRpcProvider()
  const isIceEnabled = useIsIceEnabled()

  const { data, isLoading } = usePapiEntries(
    "Intent.AccountIntents",
    [address],
    { enabled: isIceEnabled && isReady && !!address },
  )

  const ids = useMemo(
    () => (data ?? []).map(({ keyArgs }) => keyArgs[1]),
    [data],
  )

  return { ids, isLoading }
}

export const useAccountIntents = (address: string) => {
  const { papi } = useRpcProvider()
  const { ids, isLoading: isIdsLoading } = useAccountIntentIds(address)

  const { data: pairs, isLoading: isValuesLoading } = useQuery({
    queryKey: ["intents", "values", ids.map(String)],
    enabled: ids.length > 0,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const values = await papi.query.Intent.Intents.getValues(
        ids.map((id) => [id] as const),
        { at: "best" },
      )

      return ids.map((id, index): [bigint, IntentValue | null] => [
        id,
        values[index] ?? null,
      ])
    },
  })

  const data = useMemo<Array<AccountIntentEntry>>(() => {
    const byId = new Map(pairs ?? [])

    return ids.flatMap((id) => {
      const intent = byId.get(id)
      return intent ? [{ id, intent }] : []
    })
  }, [ids, pairs])

  return {
    data,
    isLoading: isIdsLoading || (ids.length > 0 && isValuesLoading),
  }
}

export const maxIntentDurationQuery = (
  context: TProviderContext,
  isIceEnabled: boolean,
) => {
  const { papi, isReady } = context

  return queryOptions({
    enabled: isIceEnabled && isReady,
    staleTime: Infinity,
    queryKey: ["intents", "maxAllowedIntentDuration"],
    queryFn: async () => {
      const maxIntentDuration =
        await papi.constants.Intent.MaxAllowedIntentDuration()
      return Number(maxIntentDuration - 60_000n) // safety margin of 60 seconds
    },
  })
}
