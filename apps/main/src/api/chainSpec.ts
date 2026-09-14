import { HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"
import { chainsMap } from "@galacticcouncil/xc-cfg"
import { EvmParachain } from "@galacticcouncil/xc-core"
import { queryOptions, useQuery } from "@tanstack/react-query"

import type { Papi, WsPolkadotClient } from "@/api/rpcClient"
import { TProviderContext, useRpcProvider } from "@/providers/rpcProvider"

export const getHydrationGenesisHash = (): string | undefined => {
  const chain = chainsMap.get(HYDRATION_CHAIN_KEY) as EvmParachain
  return chain?.genesisHash
}

export const isHydrationFork = (genesisHash: string | undefined): boolean => {
  const canonical = getHydrationGenesisHash()
  if (!genesisHash || !canonical) return false

  return genesisHash !== canonical
}

export const fetchChainSpecData = async (
  papiClient: WsPolkadotClient,
  papi: Papi,
) => {
  const [chainSpecData, lastRuntimeUpgrade] = await Promise.all([
    papiClient.getChainSpecData(),
    papi.query.System.LastRuntimeUpgrade.getValue(),
  ])

  return {
    chainSpecData,
    lastRuntimeUpgrade,
  }
}

export const chainSpecDataQueryOptions = (
  rpcUrl: string,
  papiClient: WsPolkadotClient,
  papi: Papi,
  enabled = true,
) =>
  queryOptions({
    queryKey: ["chainSpecData", rpcUrl],
    queryFn: () => fetchChainSpecData(papiClient, papi),
    enabled: enabled && !!rpcUrl,
    staleTime: Infinity,
  })

export const chainSpecDataQuery = (context: TProviderContext) =>
  chainSpecDataQueryOptions(
    context.endpoint,
    context.papiClient,
    context.papi,
    context.isReady,
  )

export const useChainSpecData = () => {
  const { endpoint, papiClient, papi, isReady } = useRpcProvider()

  return useQuery(
    chainSpecDataQueryOptions(endpoint, papiClient, papi, isReady),
  )
}
