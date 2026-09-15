import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { useTranslation } from "react-i18next"

import { blockTimeQuery } from "@/api/chain"
import { bestBuyQuery, bestSellTwapQuery, TradeType } from "@/api/trade"
import { MarketFormValues } from "@/modules/trade/swap/sections/Market/lib/useMarketForm"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { TransactionActions, useTransactionsStore } from "@/states/transactions"
import { scaleHuman } from "@/utils/formatting"

export const useSubmitTwap = (actions?: TransactionActions) => {
  const { t } = useTranslation(["common", "trade"])
  const rpc = useRpcProvider()
  const { sdk } = rpc
  const { account } = useAccount()
  const address = account?.address ?? ""
  const {
    swap: {
      split: { twapSlippage, twapMaxRetries },
    },
  } = useTradeSettings()

  const { createTransaction } = useTransactionsStore()

  return useMutation({
    mutationFn: async (values: MarketFormValues) => {
      const { sellAsset, buyAsset } = values

      if (!sellAsset) throw new Error("Invalid sell asset")
      if (!buyAsset) throw new Error("Invalid buy asset")

      const sellDecimals = sellAsset.decimals
      const sellSymbol = sellAsset.symbol

      const budget = await (async () => {
        if (values.type !== TradeType.Buy) return values.sellAmount

        const quote = await rpc.queryClient.ensureQueryData(
          bestBuyQuery(rpc, {
            assetIn: sellAsset.id,
            assetOut: buyAsset.id,
            amountOut: values.buyAmount,
          }),
        )

        return scaleHuman(quote.amountIn, sellDecimals)
      })()

      const twap = await rpc.queryClient.ensureQueryData(
        bestSellTwapQuery(rpc, {
          assetIn: sellAsset.id,
          assetOut: buyAsset.id,
          amountIn: budget,
        }),
      )

      const blockTimeMs = await rpc.queryClient.ensureQueryData(
        blockTimeQuery(sdk),
      )

      const params = {
        noOfTrades: twap.tradeCount,
        timeframe: formatDistanceToNow(
          Date.now() + twap.tradeCount * twap.tradePeriod * blockTimeMs,
          { includeSeconds: true },
        ),
        in: t("currency", {
          value: scaleHuman(twap.tradeAmountIn, sellDecimals),
          symbol: sellSymbol,
        }),
        inTotal: t("currency", {
          value: scaleHuman(twap.amountIn, sellDecimals),
          symbol: sellSymbol,
        }),
      }

      const tx = await sdk.tx
        .order(twap)
        .withSlippage(twapSlippage)
        .withMaxRetries(twapMaxRetries)
        .withBeneficiary(address)
        .build()

      return createTransaction(
        {
          tx: tx.get(),
          toasts: {
            submitted: t("trade:market.twap.loading", params),
            success: t("trade:market.twap.success", params),
            error: t("trade:market.twap.error", params),
          },
        },
        actions,
      )
    },
  })
}
