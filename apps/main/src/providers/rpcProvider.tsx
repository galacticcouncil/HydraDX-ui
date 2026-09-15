import { DryRunErrorDecoder, logger } from "@galacticcouncil/utils"
import {
  QueryClient,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { StatusChange, WsEvent } from "polkadot-api/ws"
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react"

import { rpcProviderQuery, switchRpc, TProviderData } from "@/api/rpcClient"
import { getProviderDataEnv } from "@/api/rpcConfig"
import { TDataEnv } from "@/config/rpc"
import { useAssetRegistryStore } from "@/states/assetRegistry"
import { useProviderRpcUrlStore } from "@/states/provider"

export type TProviderContext = TProviderData & {
  /** The endpoint is connected and not mid-switch. */
  isEndpointSettled: boolean
  /** The endpoint is settled AND the asset registry is populated for it. */
  isReady: boolean
  dataEnv: TDataEnv
  endpoint: string
}

/**
 * The boot shell's context, and load-bearing despite the casts.
 *
 * The root route's `pendingComponent` is the router's top-level Suspense
 * fallback, and the root match gets no boundary of its own - so while
 * `RpcProvider`'s suspense query is pending, `LayoutSkeleton` renders OUTSIDE
 * this provider. Its tree calls `useRpcProvider()` unconditionally (Footer ->
 * DataProviderSelect, SubNavBar -> useNavigation, Settings). Those reads only
 * touch `featureFlags` and `isReady: false`; everything that would touch
 * `papi`/`sdk` is gated behind `isReady`, which is why the casts never blow up.
 *
 * Removing this default - or making `useRpcProvider()` throw - white-screens
 * every cold boot until that shell tree is made provider-free.
 */
const defaultData: TProviderContext = {
  queryClient: {} as QueryClient,
  rpcUrlList: [],
  papi: {} as TProviderData["papi"],
  papiNext: {} as TProviderData["papiNext"],
  sdk: {} as TProviderData["sdk"],
  papiClient: {} as TProviderData["papiClient"],
  genesisHash: "",
  evm: {} as TProviderData["evm"],
  featureFlags: {
    hollarBondsEnabled: true,
    bilEnabled: false,
    propellerEnabled: true,
  },
  dryRunErrorDecoder: {} as DryRunErrorDecoder,
  isEndpointSettled: false,
  isReady: false,
  dataEnv: "mainnet",
  endpoint: "",
}

const ProviderContext = createContext<TProviderContext>(defaultData)

export const useRpcProvider = () => useContext(ProviderContext)

const logWsStatusChange = (status: StatusChange) => {
  switch (status.type) {
    case WsEvent.CONNECTING:
      logger.info("[WS] CONNECTING", status.uri)
      break
    case WsEvent.CONNECTED:
      logger.info("[WS] CONNECTED", status.uri)
      break
    case WsEvent.CLOSE:
      logger.info("[WS] CLOSED", status.event)
      break
    case WsEvent.ERROR:
      logger.error("[WS] ERROR", status)
      break
  }
}

export const RpcProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const hasAssets = useAssetRegistryStore((state) => state.assets.length > 0)
  const registryGenesisHash = useAssetRegistryStore(
    (state) => state.genesisHash,
  )

  const rpcUrl = useProviderRpcUrlStore((state) => state.rpcUrl)
  const connectedRpcUrl = useProviderRpcUrlStore(
    (state) => state.connectedRpcUrl,
  )
  const rpcUrlList = useProviderRpcUrlStore((state) => state.rpcUrlList)

  const { data } = useSuspenseQuery(
    rpcProviderQuery(queryClient, rpcUrlList, {
      priorityRpcUrl: rpcUrl,
      probeConfig: {
        enabled: false,
      },
      wsProviderOpts: {
        onStatusChanged: (status) => {
          logWsStatusChange(status)
          const {
            rpcUrl,
            connectedRpcUrl,
            setRpcUrl,
            setConnectedRpcUrl,
            setIsRpcConnecting,
          } = useProviderRpcUrlStore.getState()
          if (status.type === WsEvent.CONNECTING) setIsRpcConnecting(true)
          if (status.type === WsEvent.CONNECTED) {
            if (status.uri !== connectedRpcUrl) {
              setConnectedRpcUrl(status.uri)
            }
            if (status.uri !== rpcUrl) setRpcUrl(status.uri)
            setIsRpcConnecting(false)
          }
        },
      },
    }),
  )

  useEffect(() => {
    // switch to best rpc when auto mode is enabled
    return useProviderRpcUrlStore.subscribe((state, prevState) => {
      if (!state.autoMode || state.rpcUrl === prevState.rpcUrl) return
      switchRpc(state.rpcUrl, data)
    })
  }, [data])

  const isEndpointSettled = rpcUrl === connectedRpcUrl
  const isRegistryReady = hasAssets && registryGenesisHash === data.genesisHash
  const isReady = isEndpointSettled && isRegistryReady

  const dataEnv = getProviderDataEnv(rpcUrl)

  const value = useMemo<TProviderContext>(
    () => ({
      ...data,
      isEndpointSettled,
      isReady,
      endpoint: rpcUrl,
      dataEnv,
    }),
    [data, dataEnv, isEndpointSettled, isReady, rpcUrl],
  )

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  )
}
