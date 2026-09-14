import Big from "big.js"

const PRICE_IMPACT_SLIPPAGE_THRESHOLD = 0.25

export const getMaxSlippageThreshold = (priceImpact: number) => {
  return Big.min(
    Big.max(priceImpact * PRICE_IMPACT_SLIPPAGE_THRESHOLD, 0.01),
    1,
  ).toFixed(2)
}
