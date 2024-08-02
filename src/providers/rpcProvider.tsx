import { type TradeRouter, type PoolService } from "@galacticcouncil/sdk"
import { ApiPromise } from "@polkadot/api"
import { useProviderAssets, useProviderData } from "api/provider"
import { ReactNode, createContext, useContext, useMemo } from "react"
import { useWindowFocus } from "hooks/useWindowFocus"
import { useAssetRegistry } from "state/store"
import { useDisplayAssetStore } from "utils/displayAsset"
import { useShareTokens } from "api/xyk"
import { AssetsProvider } from "./assets"

type TProviderContext = {
  api: ApiPromise
  tradeRouter: TradeRouter
  poolService: PoolService
  isLoaded: boolean
  featureFlags: any
}
const ProviderContext = createContext<TProviderContext>({
  isLoaded: false,
  api: {} as TProviderContext["api"],
  tradeRouter: {} as TradeRouter,
  featureFlags: {} as TProviderContext["featureFlags"],
  poolService: {} as TProviderContext["poolService"],
})

export const useRpcProvider = () => useContext(ProviderContext)

export const RpcProvider = ({ children }: { children: ReactNode }) => {
  const { assets } = useAssetRegistry.getState()
  const isAssets = !!assets.length
  const providerData = useProviderData()
  const displayAsset = useDisplayAssetStore()
  useProviderAssets()
  useShareTokens()

  useWindowFocus({
    onFocus: () => {
      const provider = providerData.data?.api

      if (provider && !provider.isConnected) {
        provider.connect()
      }
    },
  })

  const value = useMemo(() => {
    if (!!providerData.data && isAssets) {
      const {
        isStableCoin,
        stableCoinId: chainStableCoinId,
        update,
      } = displayAsset

      let stableCoinId: string | undefined

      // set USDT as a stable token
      stableCoinId = assets.find((asset) => asset.symbol === "USDT")?.id

      // set DAI as a stable token if there is no USDT
      if (!stableCoinId) {
        stableCoinId = assets.find((asset) => asset.symbol === "DAI")?.id
      }

      if (stableCoinId && isStableCoin && chainStableCoinId !== stableCoinId) {
        // setting stable coin id from asset registry
        update({
          id: stableCoinId,
          symbol: "$",
          isRealUSD: false,
          isStableCoin: true,
          stableCoinId,
        })
      }

      return {
        poolService: providerData.data.poolService,
        api: providerData.data.api,
        tradeRouter: providerData.data.tradeRouter,
        featureFlags: providerData.data.featureFlags,
        isLoaded: true,
      }
    }

    return {
      isLoaded: false,
      api: {} as TProviderContext["api"],
      tradeRouter: {} as TradeRouter,
      featureFlags: {} as TProviderContext["featureFlags"],
      poolService: {} as TProviderContext["poolService"],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayAsset, isAssets, providerData.data])

  return (
    <ProviderContext.Provider value={value}>
      <AssetsProvider>{children}</AssetsProvider>
    </ProviderContext.Provider>
  )
}
