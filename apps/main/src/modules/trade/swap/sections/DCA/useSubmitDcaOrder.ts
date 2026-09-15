import { getTimeFrameMillis } from "@galacticcouncil/main/src/components/TimeFrame/TimeFrame.utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { dcaTradeOrderQuery } from "@/api/trade"
import {
  DcaFormValues,
  DcaOrdersMode,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useNeckworkSyncStore } from "@/states/neckwork"
import { useTradeSettings } from "@/states/tradeSettings"
import {
  getTxResultBlockHeight,
  isSubstrateTxResult,
  useTransactionsStore,
} from "@/states/transactions"
import { scaleHuman } from "@/utils/formatting"

export const useSubmitDcaOrder = () => {
  const { t } = useTranslation(["common", "trade"])

  const rpc = useRpcProvider()
  const { account } = useAccount()
  const address = account?.address

  const {
    dca: { slippage, maxRetries },
  } = useTradeSettings()

  const { createTransaction } = useTransactionsStore()
  const armNeckworkSync = useNeckworkSyncStore((state) => state.arm)

  return useMutation({
    mutationFn: async (values: DcaFormValues) => {
      const { sellAsset, buyAsset, sellAmount, orders } = values

      if (!sellAsset) throw new Error("Invalid sell asset")
      if (!buyAsset) throw new Error("Invalid buy asset")
      if (!address) throw new Error("No account address")

      const { order, orderTx } = await rpc.queryClient.ensureQueryData(
        dcaTradeOrderQuery(rpc, {
          form: values,
          slippage,
          maxRetries,
          address,
        }),
      )

      if (!order || !orderTx) throw new Error("Failed to build DCA order")

      const sellDecimals = sellAsset.decimals
      const sellSymbol = sellAsset.symbol
      const buySymbol = buyAsset.symbol
      const duration = getTimeFrameMillis(values.duration)
      const frequency = order.tradeCount > 0 ? duration / order.tradeCount : 0
      const isOpenBudget = orders.type === DcaOrdersMode.OpenBudget

      const params = {
        amountIn: t("currency", {
          value: scaleHuman(order.tradeAmountIn, sellDecimals),
          symbol: sellSymbol,
        }),
        amountInBudget: t("currency", {
          value: sellAmount,
          symbol: sellSymbol,
        }),
        assetOut: buySymbol,
        frequency: isOpenBudget ? duration : frequency,
      }

      return createTransaction(
        {
          tx: orderTx,
          toasts: {
            submitted: t(
              `trade:dca.${isOpenBudget ? "openBudget" : "limitedBudget"}.tx.loading`,
              params,
            ),
            success: t(
              `trade:dca.${isOpenBudget ? "openBudget" : "limitedBudget"}.tx.success`,
              params,
            ),
            error: t(
              `trade:dca.${isOpenBudget ? "openBudget" : "limitedBudget"}.tx.error`,
              params,
            ),
          },
        },
        {
          // arm the indexer sync for the first execution rather than the block
          // the schedule landed in, so the enrichment has an amount to report
          onSuccess: (event) => {
            const blockHeight = getTxResultBlockHeight(event)
            if (blockHeight === null) return

            const planned = isSubstrateTxResult(event)
              ? (event.events.find(
                  (e) =>
                    e.type === "DCA" && e.value.type === "ExecutionPlanned",
                )?.value.value as { block: number } | undefined)
              : undefined

            console.log({ planned, blockHeight })

            armNeckworkSync(planned?.block ?? blockHeight + 1)
          },
        },
      )
    },
  })
}
