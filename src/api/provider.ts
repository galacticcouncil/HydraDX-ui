import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { SubstrateApis } from "@galacticcouncil/xcm-core"
import { useMemo } from "react"
import { useShallow } from "hooks/useShallow"
import { omit, pick } from "utils/rx"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { useRpcProvider } from "providers/rpcProvider"
import {
  AssetClient,
  PoolService,
  PoolType,
  TradeRouter,
} from "@galacticcouncil/sdk"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { useAssetRegistry, useSettingsStore } from "state/store"
import { undefinedNoop } from "utils/helpers"
import { ExternalAssetCursor } from "@galacticcouncil/apps"
import { PENDULUM_ID } from "./externalAssetRegistry"
import { getPendulumAssetIdFromGeneralKey } from "utils/externalAssets"

export type TEnv = "testnet" | "mainnet"
export type ProviderProps = {
  name: string
  url: string
  indexerUrl: string
  squidUrl: string
  env: string | string[]
  dataEnv: TEnv
}

export const PROVIDERS: ProviderProps[] = [
  {
    name: "GalacticCouncil",
    url: "wss://rpc.hydradx.cloud",
    indexerUrl: "https://explorer.hydradx.cloud/graphql",
    squidUrl: "https://hydra-data-squid.play.hydration.cloud/graphql",
    env: "production",
    dataEnv: "mainnet",
  },
  {
    name: "Dwellir",
    url: "wss://hydradx-rpc.dwellir.com",
    indexerUrl: "https://explorer.hydradx.cloud/graphql",
    squidUrl: "https://hydra-data-squid.play.hydration.cloud/graphql",
    env: "production",
    dataEnv: "mainnet",
  },
  {
    name: "Helikon",
    url: "wss://rpc.helikon.io/hydradx",
    indexerUrl: "https://explorer.hydradx.cloud/graphql",
    squidUrl: "https://hydra-data-squid.play.hydration.cloud/graphql",
    env: "production",
    dataEnv: "mainnet",
  },
  {
    name: "Dotters",
    url: "wss://hydradx.paras.dotters.network",
    indexerUrl: "https://explorer.hydradx.cloud/graphql",
    squidUrl: "https://hydra-data-squid.play.hydration.cloud/graphql",
    env: "production",
    dataEnv: "mainnet",
  },
  {
    name: "Testnet",
    url: "wss://rpc.nice.hydration.cloud",
    indexerUrl: "https://archive.nice.hydration.cloud/graphql",
    squidUrl: "https://data-squid.nice.hydration.cloud/graphql",
    env: ["development"],
    dataEnv: "testnet",
  },
  {
    name: "Rococo via GC",
    url: "wss://hydradx-rococo-rpc.play.hydration.cloud",
    indexerUrl: "https://hydradx-rococo-explorer.play.hydration.cloud/graphql",
    squidUrl:
      "https://squid.subsquid.io/hydradx-rococo-data-squid/v/v1/graphql",
    env: ["rococo", "development"],
    dataEnv: "testnet",
  },
]

export const PROVIDER_LIST = PROVIDERS.filter((provider) =>
  typeof provider.env === "string"
    ? provider.env === import.meta.env.VITE_ENV
    : provider.env.includes(import.meta.env.VITE_ENV),
)

export const PROVIDER_URLS = PROVIDER_LIST.map(({ url }) => url)

export const useProviderRpcUrlStore = create(
  persist<{
    rpcUrl: string
    autoMode: boolean
    setRpcUrl: (rpcUrl: string | undefined) => void
    getDataEnv: () => TEnv
    setAutoMode: (state: boolean) => void
    _hasHydrated: boolean
    _setHasHydrated: (value: boolean) => void
  }>(
    (set, get) => ({
      rpcUrl: import.meta.env.VITE_PROVIDER_URL,
      autoMode: true,
      setRpcUrl: (rpcUrl) => set({ rpcUrl }),
      setAutoMode: (state) => set({ autoMode: state }),
      getDataEnv: () => {
        const { rpcUrl } = get()
        return (
          PROVIDERS.find((provider) => provider.url === rpcUrl)?.dataEnv ??
          "mainnet"
        )
      },
      _hasHydrated: false,
      _setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "rpcUrl",
      version: 2.1,
      getStorage: () => ({
        async getItem(name: string) {
          return window.localStorage.getItem(name)
        },
        setItem(name, value) {
          window.localStorage.setItem(name, value)
        },
        removeItem(name) {
          window.localStorage.removeItem(name)
        },
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    },
  ),
)

export const useActiveRpcUrlList = () => {
  const { autoMode, rpcUrl } = useProviderRpcUrlStore(
    useShallow((state) => pick(state, ["autoMode", "rpcUrl"])),
  )
  return autoMode ? PROVIDER_URLS : [rpcUrl]
}

export const useProviderAssets = () => {
  const { data: provider } = useProviderData()
  const rpcUrlList = useActiveRpcUrlList()

  return useQuery(
    QUERY_KEYS.assets(rpcUrlList.join()),
    provider
      ? async () => {
          const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()
          const degenMode = useSettingsStore.getState().degenMode
          const { tokens: externalTokens } = degenMode
            ? ExternalAssetCursor.deref().state
            : useUserExternalTokenStore.getState()
          const { sync } = useAssetRegistry.getState()

          const assetClient = new AssetClient(provider.api)

          const [tradeAssets, sdkAssets] = await Promise.all([
            provider.tradeRouter.getAllAssets(),
            assetClient.getOnChainAssets(true, externalTokens[dataEnv]),
            provider.api.query.assetRegistry.assets.entries(),
          ])

          if (sdkAssets.length) {
            sync(
              sdkAssets.map((asset) => {
                const isTradable = tradeAssets.some(
                  (tradeAsset) => tradeAsset.id === asset.id,
                )

                return {
                  ...omit(["externalId"], asset),
                  symbol: asset.symbol ?? "",
                  decimals: asset.decimals ?? 0,
                  name: asset.name ?? "",
                  externalId:
                    asset.origin === PENDULUM_ID &&
                    typeof asset.externalId === "object"
                      ? getPendulumAssetIdFromGeneralKey(asset.externalId)
                      : asset.externalId?.toString(),
                  isTradable,
                }
              }),
            )
          }

          return sdkAssets
        }
      : undefinedNoop,
    {
      enabled: !!provider,
      cacheTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 1,
    },
  )
}

export const useProviderData = () => {
  const rpcUrlList = useActiveRpcUrlList()
  const { setRpcUrl } = useProviderRpcUrlStore()

  return useQuery(
    QUERY_KEYS.provider(rpcUrlList.join()),
    async () => {
      const maxRetries = rpcUrlList.length * 5
      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(rpcUrlList, maxRetries)

      const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()
      const degenMode = useSettingsStore.getState().degenMode
      const { tokens: externalTokens } = degenMode
        ? ExternalAssetCursor.deref().state
        : useUserExternalTokenStore.getState()

      api.registry.register({
        XykLMDeposit: {
          shares: "u128",
          ammPoolId: "AccountId",
          yieldFarmEntries: "Vec<PalletLiquidityMiningYieldFarmEntry>",
        },
        OmnipoolLMDeposit: {
          shares: "u128",
          ammPoolId: "u32",
          yieldFarmEntries: "Vec<PalletLiquidityMiningYieldFarmEntry>",
        },
      })

      const poolService = new PoolService(api)
      const traderRoutes = [
        PoolType.Omni,
        PoolType.Stable,
        PoolType.XYK,
        PoolType.LBP,
      ]

      const tradeRouter = new TradeRouter(poolService, {
        includeOnly: traderRoutes,
      })

      await poolService.syncRegistry(externalTokens[dataEnv])

      const [isReferralsEnabled, isDispatchPermitEnabled] = await Promise.all([
        api.query.referrals,
        api.tx.multiTransactionPayment.dispatchPermit,
        tradeRouter.getPools(),
      ])

      return {
        api,
        tradeRouter,
        poolService,
        featureFlags: {
          referrals: !!isReferralsEnabled,
          dispatchPermit: !!isDispatchPermitEnabled,
        },
      }
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
      onSettled: (data) => {
        if (data?.api) {
          const provider = getProviderInstance(data.api)
          setRpcUrl(provider.endpoint)
        }
      },
    },
  )
}

export const useRefetchProviderData = () => {
  const queryClient = useQueryClient()
  const rpcList = useActiveRpcUrlList()

  return () => {
    queryClient.invalidateQueries(QUERY_KEYS.provider(rpcList.join()))
    queryClient.invalidateQueries(QUERY_KEYS.assets(rpcList.join()))
  }
}

export const useIndexerUrl = () => {
  const activeProvider = useActiveProvider()
  return activeProvider.indexerUrl
}

export const useSquidUrl = () => {
  const activeProvider = useActiveProvider()
  return activeProvider.squidUrl
}

export const useActiveProvider = (): ProviderProps => {
  const { api, isLoaded } = useRpcProvider()

  const activeRpcUrl = useMemo(() => {
    if (!isLoaded) return undefined

    let rpcUrl = import.meta.env.VITE_PROVIDER_URL
    try {
      const provider = api ? getProviderInstance(api) : null
      if (provider?.endpoint) {
        rpcUrl = provider.endpoint
      }
    } catch (e) {}
    return rpcUrl
  }, [api, isLoaded])

  return (
    PROVIDERS.find((provider) => provider.url === activeRpcUrl) || {
      name: "",
      url: import.meta.env.VITE_PROVIDER_URL,
      indexerUrl: import.meta.env.VITE_INDEXER_URL,
      squidUrl: import.meta.env.VITE_SQUID_URL,
      env: import.meta.env.VITE_ENV,
      dataEnv:
        import.meta.env.VITE_ENV === "production" ? "mainnet" : "testnet",
    }
  )
}

export function getProviderInstance(api: ApiPromise) {
  // @ts-ignore
  const options = api?._options
  return options?.provider as WsProvider
}
