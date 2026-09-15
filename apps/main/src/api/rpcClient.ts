import { ApiOptions, SubstrateApis } from "@galacticcouncil/common"
import {
  getMetadata,
  hydration,
  hydrationNext,
} from "@galacticcouncil/descriptors"
import { createSdkContext, SdkCtx } from "@galacticcouncil/sdk-next"
import { DryRunErrorDecoder } from "@galacticcouncil/utils"
import { QueryClient, queryOptions } from "@tanstack/react-query"
import { TypedApi } from "polkadot-api"
import { createWsClient } from "polkadot-api/ws"
import { doNothing } from "remeda"
import { createPublicClient, custom, PublicClient } from "viem"

import { rpcStatusQueryOptions } from "@/api/rpc"
import { getSortedRpcUrlList } from "@/api/rpcConfig"
import { ENV } from "@/config/env"
import { PROPELLER_VAULTS } from "@/modules/strategies/propeller/config/vaults"
import { useProviderRpcUrlStore } from "@/states/provider"
import { clearIndexedDBStore, IndexedDBStores } from "@/utils/indexedDB"

export type Papi = TypedApi<typeof hydration>
export type PapiNext = TypedApi<typeof hydrationNext>

export type TFeatureFlags = {
  hollarBondsEnabled: boolean
  bilEnabled: boolean
  propellerEnabled: boolean
}

export type WsPolkadotClient = ReturnType<typeof createWsClient>

export type TProviderData = {
  queryClient: QueryClient
  papi: Papi
  papiNext: PapiNext
  sdk: SdkCtx
  papiClient: WsPolkadotClient
  genesisHash: string
  evm: PublicClient
  featureFlags: TFeatureFlags
  rpcUrlList: string[]
  dryRunErrorDecoder: DryRunErrorDecoder
}

type RpcProviderQueryOptions = ApiOptions & { priorityRpcUrl?: string }

export const rpcProviderQuery = (
  queryClient: QueryClient,
  rpcUrlList: string[],
  options: RpcProviderQueryOptions,
) => {
  return queryOptions({
    queryKey: ["provider"],
    queryFn: () => getProviderData(queryClient, rpcUrlList, options),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

const getProviderData = async (
  queryClient: QueryClient,
  rpcUrlList: string[] = [],
  options: RpcProviderQueryOptions,
): Promise<TProviderData> => {
  const { priorityRpcUrl, ...apiOptions } = options

  const apis = SubstrateApis.getInstance()

  apis.configureMetadataCache({
    getMetadata,
    setMetadata: doNothing,
  })

  const urls = getSortedRpcUrlList(rpcUrlList, priorityRpcUrl)

  const papiClient = apis.api(urls, apiOptions) as WsPolkadotClient

  const papi = papiClient.getTypedApi(hydration)
  const papiNext = papiClient.getTypedApi(hydrationNext)

  const evm = createPublicClient({
    transport: custom({
      request: ({ method, params }) =>
        papiClient._request(method, params || []),
    }),
  })

  const propellerEnabled = await evm
    .getCode({ address: PROPELLER_VAULTS.eth.vaultAddress })
    .then((code) => !!code && code !== "0x")
    .catch(() => false)

  // Read the connected chain's identity before anything is built on top of the
  // client. papiClient.getChainSpecData() is memoized per client and never
  // follows switch(), so it cannot be used here.
  const genesisHash = await papiClient._request<string>("chain_getBlockHash", [
    0,
  ])

  // The asset metadata CDN is warmed separately by assetMetadataQuery - it is
  // a third party and must not sit on the path to first render.
  const sdk = await createSdkContext(papiClient)

  if (ENV.VITE_HSM_ENABLED) {
    sdk.ctx.pool.withHsm()
  }

  return {
    queryClient,
    papi,
    papiNext,
    papiClient,
    genesisHash,
    evm,
    sdk,
    rpcUrlList,
    featureFlags: {
      hollarBondsEnabled: true,
      bilEnabled: true,
      propellerEnabled,
    },
    dryRunErrorDecoder: new DryRunErrorDecoder(papiClient),
  }
}

/**
 * The single chokepoint for changing the RPC endpoint. Neither caller decides
 * between switching and reloading.
 *
 * A different chain invalidates every one of the app's query keys, which are
 * written as if there were one chain. The query cache is memory-only, so a
 * reload drops all of them at once - that is what makes the switch correct
 * without rewriting the keys. A same-chain switch keeps the cache: the data is
 * at worst stale, never wrong.
 */
export const switchRpc = async (
  url: string,
  {
    queryClient,
    papiClient,
    genesisHash,
  }: Pick<TProviderData, "queryClient" | "papiClient" | "genesisHash">,
) => {
  // The endpoint list, DataProviderResolver and RpcForm all ping before we get
  // here, so this normally resolves straight out of the cache.
  const target = await queryClient.ensureQueryData(rpcStatusQueryOptions(url))

  if (target.genesisHash === genesisHash) {
    papiClient.switch(url)
    return
  }

  await clearIndexedDBStore(IndexedDBStores.AssetRegistry)
  useProviderRpcUrlStore.getState().setRpcUrl(url)
  window.location.reload()
}
