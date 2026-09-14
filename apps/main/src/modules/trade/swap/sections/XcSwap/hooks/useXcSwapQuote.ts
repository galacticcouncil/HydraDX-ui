import { XcSwapClient, XcSwapTrade } from "@galacticcouncil/xc-swap"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { useDebounce } from "react-use"

import {
  bestBuyQuery,
  bestSellQuery,
  bestSellTwapQuery,
  Trade,
  TradeOrder,
  TradeType,
} from "@/api/trade"
import { XC_SWAP_RECIPIENT_PLACEHOLDERS } from "@/modules/trade/swap/sections/XcSwap/config/meta"
import { XC_SWAP_QUOTE_DEBOUNCE_MS } from "@/modules/trade/swap/sections/XcSwap/config/ui"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { assertXcSwapQuoteParams } from "@/modules/trade/swap/sections/XcSwap/lib/assertXcSwapQuoteParams"
import { getQuoteFormUpdate } from "@/modules/trade/swap/sections/XcSwap/lib/getQuoteFormUpdate"
import { isTwapEnabled } from "@/modules/trade/swap/sections/XcSwap/lib/isTwapEnabled"
import {
  isXcDestAsset,
  sellAssetToXcAsset,
} from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapAssets"
import { XcAsset } from "@/modules/trade/swap/sections/XcSwap/types"
import { useRpcProvider } from "@/providers/rpcProvider"
import { scale, scaleHuman } from "@/utils/formatting"

export type XcSwapQuote =
  | { kind: "xc"; swap: XcSwapTrade }
  | { kind: "oc"; swap: Trade; twap: TradeOrder | undefined }
  | null

type UseXcSwapQuoteParams = {
  form: UseFormReturn<XcSwapFormValues>
  rpc: ReturnType<typeof useRpcProvider>
  xcSwap: XcSwapClient
  originAssetMap: Map<string, XcAsset>
  isCrossChain: boolean
  refundTo: string | null
  swapSlippage: number
}

export const useXcSwapQuote = ({
  form,
  rpc,
  xcSwap,
  originAssetMap,
  isCrossChain,
  refundTo,
  swapSlippage,
}: UseXcSwapQuoteParams) => {
  const { isReady } = rpc

  const [
    sellAsset,
    buyAsset,
    destChain,
    isSingleTrade,
    type,
    sellAmount,
    buyAmount,
    destAddress,
  ] = form.watch([
    "sellAsset",
    "buyAsset",
    "destChain",
    "isSingleTrade",
    "type",
    "sellAmount",
    "buyAmount",
    "destAddress",
  ])

  const recipientPlaceholder = destChain
    ? XC_SWAP_RECIPIENT_PLACEHOLDERS[destChain.key]
    : undefined
  const isDestAddressValid = destChain
    ? destChain.addressValidator(destAddress.trim())
    : false

  const recipient = isDestAddressValid
    ? destAddress.trim()
    : recipientPlaceholder

  const [debouncedAmount, setDebouncedAmount] = useState("")
  useDebounce(() => setDebouncedAmount(sellAmount), XC_SWAP_QUOTE_DEBOUNCE_MS, [
    sellAmount,
  ])

  const [debouncedBuyAmount, setDebouncedBuyAmount] = useState("")
  useDebounce(
    () => setDebouncedBuyAmount(buyAmount),
    XC_SWAP_QUOTE_DEBOUNCE_MS,
    [buyAmount],
  )

  const amountIn =
    sellAsset && debouncedAmount
      ? BigInt(scale(debouncedAmount, sellAsset.decimals))
      : null

  const xcQuoteEnabled =
    isCrossChain &&
    isReady &&
    !!refundTo &&
    !!recipient &&
    !!sellAsset &&
    isXcDestAsset(buyAsset) &&
    amountIn !== null &&
    amountIn > 0n

  const {
    data: xcTrade,
    isLoading: isXcQuoteLoading,
    isFetching: isXcQuoteFetching,
    isPlaceholderData: isXcPlaceholderData,
    error: xcQuoteError,
  } = useQuery({
    enabled: xcQuoteEnabled,
    retry: false,
    placeholderData: amountIn ? keepPreviousData : undefined,
    queryKey: [
      "xcSwap",
      "quote",
      sellAsset?.id,
      amountIn?.toString(),
      isXcDestAsset(buyAsset) ? buyAsset.oneClickId : undefined,
      recipient,
      refundTo,
      swapSlippage,
    ],
    queryFn: () => {
      if (!sellAsset) {
        throw new Error("Source asset is required")
      }

      return xcSwap.swap(
        assertXcSwapQuoteParams({
          srcAsset: sellAssetToXcAsset(sellAsset, originAssetMap),
          amountIn,
          destAsset: buyAsset,
          recipient,
          refundTo,
          slippage: swapSlippage,
        }),
      )
    },
  })

  const isOnChainBuy = !isCrossChain && type === TradeType.Buy
  const omnipoolAssetIn = sellAsset?.id ?? ""
  const omnipoolAssetOut = buyAsset?.id !== undefined ? String(buyAsset.id) : ""

  const omnipoolQueryOptions = isOnChainBuy
    ? bestBuyQuery(rpc, {
        assetIn: omnipoolAssetIn,
        assetOut: omnipoolAssetOut,
        amountOut: debouncedBuyAmount,
      })
    : bestSellQuery(rpc, {
        assetIn: omnipoolAssetIn,
        assetOut: omnipoolAssetOut,
        amountIn: debouncedAmount,
      })
  const debouncedInput = isOnChainBuy ? debouncedBuyAmount : debouncedAmount
  const {
    data: omnipoolTrade,
    isLoading: isOmnipoolQuoteLoading,
    isFetching: isOmnipoolQuoteFetching,
    isPlaceholderData: isOmnipoolPlaceholderData,
    error: omnipoolQuoteError,
  } = useQuery({
    ...omnipoolQueryOptions,
    enabled: !isCrossChain && omnipoolQueryOptions.enabled,
    placeholderData: debouncedInput ? keepPreviousData : undefined,
  })

  // The chain no longer accepts buy schedules, so a buy intent is scheduled as
  // a sell of what the buy quote says it costs
  const twapBudget = isOnChainBuy
    ? omnipoolTrade && sellAsset
      ? scaleHuman(omnipoolTrade.amountIn, sellAsset.decimals)
      : ""
    : debouncedAmount

  const twapEnabled = !isCrossChain && isTwapEnabled(omnipoolTrade)

  const {
    data: twap,
    isLoading: isTwapInitialLoading,
    isFetching: isTwapQuoteFetching,
    isPlaceholderData: isTwapPlaceholderData,
  } = useQuery({
    ...bestSellTwapQuery(
      rpc,
      {
        assetIn: omnipoolAssetIn,
        assetOut: omnipoolAssetOut,
        amountIn: twapBudget,
      },
      twapEnabled,
    ),
    placeholderData: twapBudget ? keepPreviousData : undefined,
  })

  const isTwapPreviousData =
    twapEnabled && isTwapQuoteFetching && isTwapPlaceholderData

  const isTwapLoading = isOnChainBuy
    ? isOmnipoolQuoteLoading || isTwapInitialLoading
    : isTwapInitialLoading

  const validXcTrade =
    xcTrade && amountIn !== null && xcTrade.amountIn.amount === amountIn
      ? xcTrade
      : undefined

  const validOmnipoolTrade =
    omnipoolTrade &&
    omnipoolTrade.type === (isOnChainBuy ? TradeType.Buy : TradeType.Sell) &&
    String(omnipoolTrade.swaps[0]?.assetIn) === omnipoolAssetIn &&
    String(omnipoolTrade.swaps.at(-1)?.assetOut) === omnipoolAssetOut
      ? omnipoolTrade
      : undefined

  const validTwap =
    twap &&
    String(twap.assetIn) === omnipoolAssetIn &&
    String(twap.assetOut) === omnipoolAssetOut
      ? twap
      : undefined

  const quote = useMemo<XcSwapQuote>(() => {
    if (isCrossChain) {
      if (!xcQuoteEnabled) return null
      return validXcTrade ? { kind: "xc", swap: validXcTrade } : null
    }
    return validOmnipoolTrade
      ? { kind: "oc", swap: validOmnipoolTrade, twap: validTwap }
      : null
  }, [
    isCrossChain,
    xcQuoteEnabled,
    validXcTrade,
    validOmnipoolTrade,
    validTwap,
  ])

  const isInputSettled = isOnChainBuy
    ? debouncedBuyAmount === buyAmount
    : debouncedAmount === sellAmount

  const isQuoteRefreshing =
    !isInputSettled ||
    (isCrossChain
      ? isXcQuoteFetching && isXcPlaceholderData
      : isSingleTrade
        ? isOmnipoolQuoteFetching && isOmnipoolPlaceholderData
        : (isOmnipoolQuoteFetching && isOmnipoolPlaceholderData) ||
          isTwapPreviousData)

  const isQuoteLoading = isCrossChain
    ? isXcQuoteLoading
    : isOmnipoolQuoteLoading
  const quoteError = isCrossChain ? xcQuoteError : omnipoolQuoteError

  useEffect(() => {
    const { field, value } = getQuoteFormUpdate({
      quote,
      type,
      sellAsset,
      buyAsset,
      isSingleTrade,
    })

    if (form.getValues(field) !== value) {
      form.setValue(field, value, { shouldValidate: true })
    }
  }, [quote, buyAsset, sellAsset, form, isSingleTrade, type])

  return { quote, isQuoteLoading, isTwapLoading, isQuoteRefreshing, quoteError }
}
