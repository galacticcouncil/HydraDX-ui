import {
  NECKWORK_ACCOUNT_KEY,
  neckworkStatusQuery,
} from "@galacticcouncil/indexer/neckwork"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { neckworkClient } from "@/api/neckwork"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useNeckworkEnabled, useNeckworkSyncStore } from "@/states/neckwork"

const STATUS_POLL_INTERVAL = 10_000

/** Give up waiting for the indexer after this long and refresh anyway. */
const ARM_TIMEOUT = 120_000

/**
 * Bridges the gap between "my tx landed in a block" and "the indexer can see
 * it". While armed, polls the cheap /v1/status endpoint instead of the account
 * queries themselves, then invalidates them once — one small request loop
 * rather than refetching every mounted table on a timer.
 */
export const useNeckworkSync = () => {
  const queryClient = useQueryClient()
  const neckworkEnabled = useNeckworkEnabled()
  const { isFork } = useRpcProvider()
  const syncEnabled = neckworkEnabled && !isFork

  const armedForBlock = useNeckworkSyncStore((state) => state.armedForBlock)
  const armedAt = useNeckworkSyncStore((state) => state.armedAt)
  const disarm = useNeckworkSyncStore((state) => state.disarm)

  const isArmed = armedForBlock !== null

  const { data: status } = useQuery({
    ...neckworkStatusQuery(neckworkClient),
    enabled: syncEnabled && isArmed,
    refetchInterval: STATUS_POLL_INTERVAL,
  })

  const indexedBlock = status?.blockHeight
  const isIndexed =
    !!indexedBlock && !!armedForBlock && indexedBlock >= armedForBlock

  const isTimedOut = !!armedAt && Date.now() - armedAt >= ARM_TIMEOUT

  useEffect(() => {
    if (!isArmed) return

    // nothing polls while neckwork is off, so nothing would ever disarm us
    if (!syncEnabled) {
      disarm()
      return
    }

    if (!isIndexed && !isTimedOut) return

    disarm()
    console.log("invalidating queries for neckwork sync")
    queryClient.invalidateQueries({ queryKey: NECKWORK_ACCOUNT_KEY })
  }, [isArmed, isIndexed, isTimedOut, syncEnabled, disarm, queryClient])
}
