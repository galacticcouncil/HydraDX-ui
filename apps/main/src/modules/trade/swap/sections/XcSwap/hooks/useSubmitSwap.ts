import { useAccount } from "@galacticcouncil/web3-connect"
import { CallType } from "@galacticcouncil/xc-core"
import { useMutation } from "@tanstack/react-query"
import React from "react"
import { useTranslation } from "react-i18next"
import { toLowerCase } from "remeda"

import { Trade, TradeType } from "@/api/trade"
import { SellAllAlert } from "@/modules/trade/swap/sections/XcSwap/components/SellAllAlert"
import { getIceSwapAmounts } from "@/modules/trade/swap/sections/XcSwap/lib/iceAmounts"
import { SwapSubmitValues } from "@/modules/trade/swap/sections/XcSwap/types"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"
import { useToasts } from "@/states/toasts"
import { useTradeSettings } from "@/states/tradeSettings"
import {
  isSubstrateTxResult,
  TransactionActions,
  TransactionType,
  useTransactionsStore,
} from "@/states/transactions"
import { scaleHuman } from "@/utils/formatting"

const FILL_WATCH_TIMEOUT_MS = 3 * 60 * 1000

export const useSubmitSwap = (actions?: TransactionActions) => {
  const { t } = useTranslation(["common", "trade"])
  const { account } = useAccount()
  const rpc = useRpcProvider()
  const { sdk, papi } = rpc
  const isIceEnabled = useIsIceEnabled()

  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()

  const { createTransaction } = useTransactionsStore()
  const { success: successToast } = useToasts()

  return useMutation({
    mutationFn: async ([values, swap]: [SwapSubmitValues, Trade]) => {
      const { sellAsset, buyAsset } = values
      const { amountIn, amountOut, type } = swap

      if (!sellAsset || !buyAsset) throw new Error("Invalid swap assets")
      if (!account) throw new Error("Account not connected")

      const sellDecimals = sellAsset.decimals
      const sellSymbol = sellAsset.symbol
      const buyDecimals = buyAsset.decimals
      const buySymbol = buyAsset.symbol

      const params =
        type === TradeType.Sell
          ? {
              in: t("currency", {
                value: scaleHuman(amountIn, sellDecimals),
                symbol: sellSymbol,
              }),
              out: t("currency", {
                value: scaleHuman(amountOut, buyDecimals),
                symbol: buySymbol,
              }),
            }
          : {
              in: t("currency", {
                value: scaleHuman(amountOut, buyDecimals),
                symbol: buySymbol,
              }),
              out: t("currency", {
                value: scaleHuman(amountIn, sellDecimals),
                symbol: sellSymbol,
              }),
            }

      if (isIceEnabled) {
        const tx = await sdk.tx
          .intentMarket(swap)
          .withBeneficiary(account.address)
          .withSlippage(swapSlippage)
          .build()

        const iceAmounts = getIceSwapAmounts(swap, swapSlippage)
        const guaranteedOutRaw = iceAmounts.amountOut

        const iceParams =
          type === TradeType.Sell
            ? {
                in: t("currency", {
                  value: scaleHuman(iceAmounts.amountIn, sellDecimals),
                  symbol: sellSymbol,
                }),
                out: t("currency", {
                  value: scaleHuman(iceAmounts.amountOut, buyDecimals),
                  symbol: buySymbol,
                }),
              }
            : {
                in: t("currency", {
                  value: scaleHuman(iceAmounts.amountOut, buyDecimals),
                  symbol: buySymbol,
                }),
                out: t("currency", {
                  value: scaleHuman(iceAmounts.amountIn, sellDecimals),
                  symbol: sellSymbol,
                }),
              }

        const watchIntentFill = (intentId: bigint, txHash: string) => {
          const timer = setTimeout(
            () => subscription.unsubscribe(),
            FILL_WATCH_TIMEOUT_MS,
          )
          // `watch()` emits one batch per finalized block — pick ours out.
          const subscription =
            papi.event.Intent.IntentResolved.watch().subscribe({
              next: ({ events }) => {
                const resolved = events.find(
                  ({ payload }) => payload.id === intentId,
                )
                if (!resolved) return

                clearTimeout(timer)
                subscription.unsubscribe()
                const received = resolved.payload.amount_out
                const bonus = received - guaranteedOutRaw
                successToast({
                  title:
                    bonus > 0n
                      ? t("trade:market.intent.filled.bonus", {
                          out: t("currency", {
                            value: scaleHuman(received, buyDecimals),
                            symbol: buySymbol,
                          }),
                          bonus: t("currency", {
                            value: scaleHuman(bonus, buyDecimals),
                            symbol: buySymbol,
                          }),
                        })
                      : t("trade:market.intent.filled", {
                          out: t("currency", {
                            value: scaleHuman(received, buyDecimals),
                            symbol: buySymbol,
                          }),
                        }),
                  meta: {
                    type: TransactionType.Onchain,
                    srcChainKey: "hydration",
                    txHash,
                    ecosystem: CallType.Substrate,
                  },
                })
              },
              error: () => clearTimeout(timer),
            })
        }

        return createTransaction(
          {
            tx: tx.get(),
            alerts: [],
            toasts: {
              submitted: t(
                `trade:market.swap.${toLowerCase(type)}.loading`,
                iceParams,
              ),
              success: t("trade:market.intent.placed", iceParams),
              error: t(
                `trade:market.swap.${toLowerCase(type)}.error`,
                iceParams,
              ),
            },
          },
          {
            ...actions,
            onSuccess: (result) => {
              actions?.onSuccess?.(result)
              if (!isSubstrateTxResult(result)) return
              const intentEvent = result.events.find(
                (e) =>
                  e.type === "Intent" && e.value.type === "IntentSubmitted",
              )
              const intentId = intentEvent?.value.value?.id
              if (typeof intentId !== "bigint") return
              watchIntentFill(intentId, result.txHash)
            },
          },
        )
      }

      const tx = await sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(account.address)
        .build()

      const isSellAll = tx.name === "RouterSellAll"

      return createTransaction(
        {
          tx: tx.get(),
          activity: "swap",
          alerts: isSellAll
            ? [
                {
                  requiresUserConsent: false,
                  variant: "warning",
                  description: React.createElement(SellAllAlert, {
                    asset: sellAsset,
                  }),
                },
              ]
            : [],
          toasts: {
            submitted: t(
              `trade:market.swap.${toLowerCase(type)}.loading`,
              params,
            ),
            success: t(
              `trade:market.swap.${toLowerCase(type)}.success`,
              params,
            ),
            error: t(`trade:market.swap.${toLowerCase(type)}.error`, params),
          },
        },
        actions,
      )
    },
  })
}
