import { SdkCtx } from "@galacticcouncil/sdk-next"
import { QUERY_KEY_BLOCK_PREFIX } from "@galacticcouncil/utils"
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { millisecondsInHour } from "date-fns/constants"
import { useEffect, useMemo } from "react"

import { useObservable } from "@/hooks/useObservable"
import { usePapiValue } from "@/hooks/usePapiValue"
import { TProviderContext, useRpcProvider } from "@/providers/rpcProvider"

export const bestNumberQuery = (context: TProviderContext) => {
  const { isReady, papi, endpoint } = context

  return queryOptions({
    enabled: isReady,
    queryKey: [QUERY_KEY_BLOCK_PREFIX, "bestNumber", endpoint],
    queryFn: async () => {
      const [validationData, blockNumber, timestamp] = await Promise.all([
        papi.query.ParachainSystem.ValidationData.getValue({
          at: "best",
        }),
        papi.query.System.Number.getValue({
          at: "best",
        }),
        papi.query.Timestamp.Now.getValue({
          at: "best",
        }),
      ])

      return {
        parachainBlockNumber: blockNumber,
        relaychainBlockNumber: validationData?.relay_parent_number,
        timestamp: Number(timestamp),
      }
    },
  })
}

export const useRelayChainBlockNumber = (disableRefetch?: boolean) => {
  const { data } = useQuery({
    ...bestNumberQuery(useRpcProvider()),
    notifyOnChangeProps: disableRefetch ? [] : undefined,
  })

  return data?.relaychainBlockNumber
}

export const useBestNumber = () => {
  return useQuery(bestNumberQuery(useRpcProvider()))
}

const RECONNECT_GRACE_MS = 2_000
const BLOCK_STALE_MS = 60_000

let lastBlockAt = Date.now()

export const useInvalidateOnBlock = () => {
  const queryClient = useQueryClient()
  const { papi, isReady } = useRpcProvider()

  const observable = useMemo(() => {
    if (!isReady) return
    return papi.query.System.Number.watchValue({ at: "best" })
  }, [isReady, papi])

  useObservable(observable, {
    enabled: isReady,
    onUpdate: () => {
      lastBlockAt = Date.now()
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_BLOCK_PREFIX],
      })
    },
  })
}

/**
 * Reloads the tab when the block subscription has gone silent. A slept or
 * backgrounded tab can come back with a dead WS that never recovers, which
 * freezes every block-driven query in the app.
 */
export const useReloadOnStaleBlocks = () => {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const onVisibilityChange = () => {
      clearTimeout(timeout)
      if (document.visibilityState !== "visible") return

      timeout = setTimeout(() => {
        const isStale = Date.now() - lastBlockAt > BLOCK_STALE_MS
        if (isStale) {
          window.location.reload()
        }
      }, RECONNECT_GRACE_MS)
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])
}

export const useBlockTimestamp = () =>
  usePapiValue("Timestamp.Now", [{ at: "best" }])

export const blockWeightsQuery = (context: TProviderContext) => {
  const { isReady, papi } = context

  return queryOptions({
    enabled: isReady,
    queryKey: ["blockWeights"],
    queryFn: () => papi.constants.System.BlockWeights(),
    staleTime: Infinity,
  })
}

export const blockTimeQuery = (sdk: SdkCtx) => {
  return queryOptions({
    queryKey: ["blockTime"],
    enabled: Object.keys(sdk).length > 0,
    queryFn: () => sdk.client.params.getBlockTime(),
    staleTime: millisecondsInHour,
    gcTime: millisecondsInHour,
    refetchOnWindowFocus: false,
  })
}

export const useBlockTime = () => {
  const { sdk } = useRpcProvider()
  return useQuery(blockTimeQuery(sdk))
}

export const useEstimateFutureBlockTimestamp = (blocksFromNow: number) => {
  const provider = useRpcProvider()
  const { data } = useQuery(bestNumberQuery(provider))
  const { data: blockTimeMs } = useBlockTime()

  const timestamp = data?.timestamp
  if (
    !timestamp ||
    !blockTimeMs ||
    !Number.isFinite(timestamp) ||
    !Number.isFinite(blockTimeMs) ||
    !Number.isFinite(blocksFromNow)
  ) {
    return null
  }

  return timestamp + blockTimeMs * blocksFromNow
}
