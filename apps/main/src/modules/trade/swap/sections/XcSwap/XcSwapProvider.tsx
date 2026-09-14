import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { HYDRATION_CHAIN_KEY, isH160Address } from "@galacticcouncil/utils"
import { useAccount, WalletMode } from "@galacticcouncil/web3-connect"
import { XcSwapClient } from "@galacticcouncil/xc-swap"
import { useSearch } from "@tanstack/react-router"
import Big from "big.js"
import { createContext, useContext, useMemo } from "react"
import { FormProvider } from "react-hook-form"

import { useKrakenSpotPrice } from "@/api/external/kraken"
import { useMaxSellAmount } from "@/modules/trade/swap/sections/XcSwap/hooks/useMaxSellAmount"
import { useXcDestBalance } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcDestBalance"
import { useXcSwapAssetPairs } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapAssetPairs"
import { useXcSwapClient } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapClient"
import {
  useXcSwapForm,
  XcSwapFormValues,
} from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { useXcSwapHealthFactor } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapHealthFactor"
import {
  useXcSwapQuote,
  XcSwapQuote,
} from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapQuote"
import { useXcSwapRequiredWalletMode } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapRequiredWalletMode"
import { useXcSwapSelection } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapSelection"
import { useXcSwapSubmit } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapSubmit"
import {
  XcAsset,
  XcChainAssetPair,
} from "@/modules/trade/swap/sections/XcSwap/types"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"

export type { XcSwapQuote }

type XcSwapContextValue = {
  readonly xcSwap: XcSwapClient | null
  readonly sourceChainAssetPairs: XcChainAssetPair[]
  readonly originAssetMap: Map<string, XcAsset>
  readonly destChainAssetPairs: XcChainAssetPair[]
  readonly isCrossChain: boolean
  readonly refundTo: string | null
  readonly quote: XcSwapQuote
  readonly isQuoteLoading: boolean
  readonly isTwapLoading: boolean
  readonly isQuoteRefreshing: boolean
  readonly healthFactor: HealthFactorResult | undefined
  readonly isHealthFactorLoading: boolean
  readonly isSelectionLoading: boolean
  readonly maxSwapSellBalance: string
  readonly maxTwapSellBalance: string
  readonly isMaxSwapSellBalanceLoading: boolean
  readonly isMaxTwapSellBalanceLoading: boolean
  readonly destBalance: string | undefined
  readonly isDestBalanceLoading: boolean
  readonly destSpotPrice: number | undefined
  readonly isDestSpotPriceLoading: boolean
  readonly onSubmit: (values: XcSwapFormValues) => void
  readonly isLoading: boolean
  readonly quoteError: Error | null
  readonly requiredWalletMode: WalletMode | null
  readonly isWalletCompatible: boolean
}

const XcSwapContext = createContext<XcSwapContextValue>({
  xcSwap: null,
  sourceChainAssetPairs: [],
  originAssetMap: new Map(),
  destChainAssetPairs: [],
  isCrossChain: false,
  refundTo: null,
  quote: null,
  isQuoteLoading: false,
  isTwapLoading: false,
  isQuoteRefreshing: false,
  healthFactor: undefined,
  isHealthFactorLoading: false,
  isSelectionLoading: true,
  maxSwapSellBalance: "0",
  maxTwapSellBalance: "0",
  isMaxSwapSellBalanceLoading: false,
  isMaxTwapSellBalanceLoading: false,
  destBalance: undefined,
  isDestBalanceLoading: false,
  destSpotPrice: undefined,
  isDestSpotPriceLoading: false,
  onSubmit: () => {},
  isLoading: false,
  quoteError: null,
  requiredWalletMode: null,
  isWalletCompatible: true,
})

export const useXcSwap = () => useContext(XcSwapContext)

type XcSwapProviderProps = {
  children: React.ReactNode
  assetIn: string
  assetOut: string
}

export const XcSwapProvider: React.FC<XcSwapProviderProps> = ({
  children,
  assetIn,
  assetOut,
}) => {
  const { account } = useAccount()
  const rpc = useRpcProvider()
  const { destPlatform } = useSearch({ from: "/trade/_history" })

  const {
    maxSwapSellBalance,
    maxTwapSellBalance,
    isMaxSwapSellBalanceLoading,
    isMaxTwapSellBalanceLoading,
  } = useMaxSellAmount({
    assetIn,
    assetOut,
    enabled: destPlatform === HYDRATION_CHAIN_KEY,
  })

  const form = useXcSwapForm({
    maxSwapSellBalance,
    maxTwapSellBalance,
    isMaxSwapSellBalanceLoading,
    isMaxTwapSellBalanceLoading,
  })
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const refundTo = isH160Address(account?.rawAddress)
    ? account.rawAddress
    : null

  const { xcSwap, chains } = useXcSwapClient()
  const {
    sourceChainAssetPairs,
    originAssetMap,
    destChainAssetPairs,
    isOriginLoading,
    isDestLoading,
  } = useXcSwapAssetPairs(chains, xcSwap)

  const { isSelectionLoading, isCrossChain } = useXcSwapSelection({
    form,
    sourceChainAssetPairs,
    destChainAssetPairs,
    assetIn,
    assetOut,
    destPlatform,
    isOriginLoading,
    isDestLoading,
  })

  const { healthFactor, isHealthFactorLoading } = useXcSwapHealthFactor({
    rpc,
    form,
    account,
    isCrossChain,
  })

  const {
    quote,
    isQuoteLoading,
    isTwapLoading,
    isQuoteRefreshing,
    quoteError,
  } = useXcSwapQuote({
    form,
    rpc,
    xcSwap,
    originAssetMap,
    isCrossChain,
    refundTo,
    swapSlippage,
  })

  const { balance: destBalance, isLoading: isDestBalanceLoading } =
    useXcDestBalance({ form })

  const destChain = form.watch("destChain")
  const { data: destSpotPrice, isLoading: isDestSpotPriceLoading } =
    useKrakenSpotPrice(destChain?.platform)

  const destChainAssetPairsWithBalance = useMemo<XcChainAssetPair[]>(() => {
    if (!destBalance || !destChain) return destChainAssetPairs

    return destChainAssetPairs.map((pair) =>
      pair.chain.key === destChain.key
        ? {
            ...pair,
            asset: {
              ...pair.asset,
              balance: destBalance,
              balanceUsd: destSpotPrice
                ? Big(destBalance).mul(destSpotPrice).toString()
                : undefined,
            },
          }
        : pair,
    )
  }, [destChainAssetPairs, destChain, destBalance, destSpotPrice])

  const { requiredWalletMode, isWalletCompatible } =
    useXcSwapRequiredWalletMode({ form, isCrossChain })

  const { onSubmit, isSubmitting } = useXcSwapSubmit({
    form,
    quote: isQuoteRefreshing ? null : quote,
    maxSwapSellBalance,
    maxTwapSellBalance,
  })

  return (
    <XcSwapContext.Provider
      value={{
        xcSwap,
        sourceChainAssetPairs,
        originAssetMap,
        destChainAssetPairs: destChainAssetPairsWithBalance,
        isCrossChain,
        refundTo,
        quote,
        isQuoteLoading,
        isTwapLoading,
        isQuoteRefreshing,
        healthFactor,
        isHealthFactorLoading,
        isSelectionLoading,
        maxSwapSellBalance,
        maxTwapSellBalance,
        isMaxSwapSellBalanceLoading,
        isMaxTwapSellBalanceLoading,
        destBalance,
        isDestBalanceLoading,
        destSpotPrice,
        isDestSpotPriceLoading,
        onSubmit,
        isLoading: isOriginLoading || isDestLoading || isSubmitting,
        quoteError,
        requiredWalletMode,
        isWalletCompatible,
      }}
    >
      <FormProvider {...form}>{children}</FormProvider>
    </XcSwapContext.Provider>
  )
}
