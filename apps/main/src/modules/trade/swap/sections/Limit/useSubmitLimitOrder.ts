import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { clamp } from "remeda"

import { bestNumberQuery } from "@/api/chain"
import { maxIntentDurationQuery } from "@/api/intents"
import {
  EXPIRY_MS,
  LimitFormValues,
} from "@/modules/trade/swap/sections/Limit/useLimitForm"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"
import { useTransactionsStore } from "@/states/transactions"
import { scale } from "@/utils/formatting"

export const useSubmitLimitOrder = () => {
  const { t } = useTranslation(["common", "trade"])
  const { account } = useAccount()

  const rpc = useRpcProvider()
  const { sdk, queryClient } = rpc
  const isIceEnabled = useIsIceEnabled()

  const createTransaction = useTransactionsStore((s) => s.createTransaction)

  return useMutation({
    mutationFn: async (values: LimitFormValues) => {
      const {
        sellAsset,
        sellAmount,
        buyAsset,
        buyAmount,
        expiry,
        partiallyFillable,
      } = values

      if (!sellAsset || !buyAsset) throw new Error("Invalid intent assets")
      if (!account) throw new Error("Account not connected")

      const amountOutRaw = BigInt(scale(buyAmount || "0", buyAsset.decimals))

      const trade = await sdk.api.router.getBestSell(
        Number(sellAsset.id),
        Number(buyAsset.id),
        BigInt(scale(sellAmount || "0", sellAsset.decimals)),
      )

      const txBuilder = sdk.tx
        .intentLimit(trade)
        .withBeneficiary(account.address)
        .withMinAmountOut(amountOutRaw)
        .withPartial(partiallyFillable)

      const expiryMs = EXPIRY_MS[expiry]

      if (expiryMs) {
        const [maxDurationMs, { timestamp }] = await Promise.all([
          queryClient.ensureQueryData(
            maxIntentDurationQuery(rpc, isIceEnabled),
          ),
          queryClient.ensureQueryData(bestNumberQuery(rpc)),
        ])
        const effectiveMs = clamp(expiryMs, { min: 1, max: maxDurationMs })
        const deadline = BigInt(timestamp + effectiveMs)
        txBuilder.withDeadline(deadline)
      }

      const tx = await txBuilder.build()

      const formattedSell = t("currency", {
        value: sellAmount,
        symbol: sellAsset.symbol,
      })
      const formattedBuy = t("currency", {
        value: buyAmount,
        symbol: buyAsset.symbol,
      })

      return createTransaction({
        tx: tx.get(),
        toasts: {
          submitted: t("trade:limit.tx.submitted", {
            amountIn: formattedSell,
            amountOut: formattedBuy,
          }),
          success: t("trade:limit.tx.success", {
            amountIn: formattedSell,
            amountOut: formattedBuy,
          }),
          error: t("trade:limit.tx.error", {
            amountIn: formattedSell,
            amountOut: formattedBuy,
          }),
        },
      })
    },
  })
}
