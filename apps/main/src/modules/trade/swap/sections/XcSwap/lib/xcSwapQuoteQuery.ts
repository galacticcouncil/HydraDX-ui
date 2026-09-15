import { TAssetData } from "@galacticcouncil/main/src/api/assets"
import { XcSwapClient } from "@galacticcouncil/xc-swap"
import { queryOptions } from "@tanstack/react-query"

import { XC_SWAP_RECIPIENT_PLACEHOLDERS } from "@/modules/trade/swap/sections/XcSwap/config/meta"
import { assertXcSwapQuoteParams } from "@/modules/trade/swap/sections/XcSwap/lib/assertXcSwapQuoteParams"
import {
  isXcDestAsset,
  sellAssetToXcAsset,
} from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapAssets"
import { XcAsset, XcChain } from "@/modules/trade/swap/sections/XcSwap/types"
import { scale } from "@/utils/formatting"

/**
 * A placeholder stands in until the recipient is a valid address
 * for the chain, so a quote can be shown before the user has pasted one.
 */
export const getXcSwapQuoteRecipient = (
  destChain: XcChain | null,
  destAddress: string,
) => {
  if (!destChain) return undefined

  const address = destAddress.trim()

  return destChain.addressValidator(address)
    ? address
    : XC_SWAP_RECIPIENT_PLACEHOLDERS[destChain.key]
}

export const requireXcSwapRecipient = (
  destChain: XcChain,
  destAddress: string,
) => {
  const address = destAddress.trim()

  if (!destChain.addressValidator(address)) {
    throw new Error("Invalid destination address")
  }

  return address
}

export const getXcSwapAmountIn = (
  sellAsset: TAssetData | null,
  amount: string,
) => (sellAsset && amount ? BigInt(scale(amount, sellAsset.decimals)) : null)

type XcSwapQuoteQueryParams = {
  readonly sellAsset: TAssetData | null
  readonly buyAsset: XcAsset | null
  readonly amountIn: bigint | null
  readonly recipient: string | undefined
  readonly refundTo: string | null
  readonly slippage: number
  readonly originAssetMap: Map<string, XcAsset>
}

export const xcSwapQuoteQuery = (
  xcSwap: XcSwapClient,
  {
    sellAsset,
    buyAsset,
    amountIn,
    recipient,
    refundTo,
    slippage,
    originAssetMap,
  }: XcSwapQuoteQueryParams,
) =>
  queryOptions({
    retry: false,
    queryKey: [
      "xcSwap",
      "quote",
      sellAsset?.id,
      amountIn?.toString(),
      isXcDestAsset(buyAsset) ? buyAsset.oneClickId : undefined,
      recipient,
      refundTo,
      slippage,
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
          slippage,
        }),
      )
    },
  })
