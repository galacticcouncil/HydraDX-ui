import { Trade, TradeType } from "@/api/trade"
import { calculateSlippage } from "@/api/utils/slippage"

/** On-chain intent amounts after slippage padding (matches IntentMarketTxBuilder). */
export const getIceSwapAmounts = (
  swap: Trade,
  slippagePct: number,
): { amountIn: bigint; amountOut: bigint } =>
  swap.type === TradeType.Buy
    ? {
        amountIn: swap.amountIn + calculateSlippage(swap.amountIn, slippagePct),
        amountOut: swap.amountOut,
      }
    : {
        amountIn: swap.amountIn,
        amountOut:
          swap.amountOut - calculateSlippage(swap.amountOut, slippagePct),
      }
