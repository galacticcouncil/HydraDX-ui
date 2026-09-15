import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import React from "react"
import { useTranslation } from "react-i18next"
import { toLowerCase } from "remeda"

import { bestBuyQuery, bestSellQuery, TradeType } from "@/api/trade"
import { MarketFormValues } from "@/modules/trade/swap/sections/Market/lib/useMarketForm"
import { MarketSellAllAlert } from "@/modules/trade/swap/sections/Market/MarketSellAllAlert"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { TransactionActions, useTransactionsStore } from "@/states/transactions"
import { scaleHuman } from "@/utils/formatting"

export const useSubmitSwap = (actions?: TransactionActions) => {
  const { t } = useTranslation(["common", "trade"])
  const rpc = useRpcProvider()
  const { sdk } = rpc
  const { account } = useAccount()
  const address = account?.address ?? ""
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()

  const { createTransaction } = useTransactionsStore()

  return useMutation({
    mutationFn: async (values: MarketFormValues) => {
      const { sellAsset, buyAsset } = values

      if (!sellAsset) throw new Error("Invalid sell asset")
      if (!buyAsset) throw new Error("Invalid buy asset")

      const swap = await rpc.queryClient.ensureQueryData(
        values.type === TradeType.Buy
          ? bestBuyQuery(rpc, {
              assetIn: sellAsset.id,
              assetOut: buyAsset.id,
              amountOut: values.buyAmount,
            })
          : bestSellQuery(rpc, {
              assetIn: sellAsset.id,
              assetOut: buyAsset.id,
              amountIn: values.sellAmount,
            }),
      )

      const { amountIn, amountOut, type } = swap

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

      const tx = await sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(address)
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
                  description: React.createElement(MarketSellAllAlert, {
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
