import type { XcSwapQuote } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapQuote"

export const isXcSwapTradeEnabled = (
  quote: XcSwapQuote,
  isSingleTrade: boolean,
): boolean => {
  if (!quote) {
    return false
  }

  if (quote.kind !== "oc") {
    return true
  }

  return isSingleTrade
    ? !quote.swap.swaps.flatMap((swap) => swap.errors).length
    : !!quote.twap && !quote.twap.errors.length
}
