import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useTranslation } from "react-i18next"
import { useDebounce } from "use-debounce"

import { bestSellQuery } from "@/api/trade"
import type { InstantQuote } from "@/modules/strategies/bil/components/WithdrawMethodPicker"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { BIL_QUERY_KEY_PREFIX } from "@/modules/strategies/bil/utils/queryKeys"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { useTransactionsStore } from "@/states/transactions"
import { scaleHuman } from "@/utils/formatting"

/**
 * Live instant-redeem quote — swap `bilAmount` aBIL → HOLLAR via the
 * BIL/HOLLAR stableswap pool.
 *
 * Debounces the input 250ms so the SDK quote isn't re-fetched on every
 * keystroke. The `discountPct` field is computed against the queue's
 * projected payout (`queueHollarOut`) so the user sees how much value
 * they sacrifice for instant exit.
 */

export function useInstantQuote(
  bilAmount: string,
  queueHollarOut: string,
): { quote: InstantQuote | undefined; isLoading: boolean } {
  const rpc = useRpcProvider()
  const { bil, hollar } = useBilStrategy()
  const [debouncedAmount] = useDebounce(bilAmount, 250)

  // The SDK's getBestSell takes amountIn as a HUMAN-readable string (the
  // form value the user typed, e.g. "100"), NOT wei. The returned swap's
  // amountOut, however, IS in wei — so we apply scaleHuman after.
  const { data: swap, isFetching } = useQuery(
    bestSellQuery(rpc, {
      assetIn: bil.id,
      assetOut: hollar.id,
      amountIn: Big(debouncedAmount || "0").gt(0) ? debouncedAmount : "0",
    }),
  )

  if (!swap || Big(debouncedAmount || "0").lte(0)) {
    return { quote: undefined, isLoading: isFetching }
  }

  const expectedHollar = scaleHuman(swap.amountOut, hollar.decimals) || "0"
  // discount as a signed % vs the queue path. Negative = instant gives
  // less than queue (the typical case — you pay a discount for liquidity).
  const discountPct = Big(queueHollarOut || "0").gt(0)
    ? Big(expectedHollar)
        .minus(queueHollarOut)
        .div(queueHollarOut)
        .times(100)
        .toNumber()
    : 0
  // SDK returns priceImpactPct as a percentage already (e.g. 0.15 = 0.15%).
  const slippagePct = Math.abs(swap.priceImpactPct ?? 0)

  return {
    quote: { expectedHollar, discountPct, slippagePct },
    isLoading: isFetching,
  }
}

/**
 * Submit the instant-redeem trade: aBIL → HOLLAR via the new stableswap
 * pool. Single substrate extrinsic (`router.sell`-equivalent built by the
 * SDK), no batching required. Slippage tolerance comes from the global
 * trade settings (same setting used by the Swap UI).
 */
export function useInstantRedeem() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil, hollar } = useBilStrategy()
  const { sdk } = useRpcProvider()
  const { account } = useAccount()
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const { createTransaction } = useTransactionsStore()
  const address = account?.address ?? ""

  return useMutation({
    mutationFn: async (bilAmount: string) => {
      // Same convention as useInstantQuote — SDK takes a human string for
      // amountIn, NOT wei.
      const swap = await sdk.api.router.getBestSell(
        Number(bil.id),
        Number(hollar.id),
        bilAmount,
      )

      const tx = await sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(address)
        .build()

      return createTransaction({
        tx: tx.get(),
        toasts: {
          submitted: t("bil.instantRedeem.toast.submitted", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
          success: t("bil.instantRedeem.toast.success", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
        },
        invalidateQueries: [[BIL_QUERY_KEY_PREFIX]],
      })
    },
  })
}
