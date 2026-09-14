import { getIndexerSdk, IndexerSdk } from "@galacticcouncil/indexer/indexer"
import { useMemo } from "react"

import { ENV } from "@/config/env"
import { useRpcProvider } from "@/providers/rpcProvider"

const INDEXER_URL_BY_RPC = {
  "wss://node3.lark.hydration.cloud":
    "https://3-explorer.lark.hydration.cloud/graphql",
} as const satisfies Record<string, string>

export const getIndexerUrl = (endpoint: string): string =>
  INDEXER_URL_BY_RPC[endpoint as keyof typeof INDEXER_URL_BY_RPC] ??
  ENV.VITE_INDEXER_URL

export const useIndexerClient = (): IndexerSdk => {
  const { endpoint } = useRpcProvider()

  return useMemo(() => getIndexerSdk(getIndexerUrl(endpoint)), [endpoint])
}
