import { getTimeFrameMillis } from "@galacticcouncil/main/src/components/TimeFrame/TimeFrame.utils"
import { TradeDcaOrder } from "@galacticcouncil/sdk-next/sor"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import Big from "big.js"
import { useTranslation } from "react-i18next"

import {
  DcaFormValues,
  DcaOrdersMode,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"
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
  const { account } = useAccount()
  const rpc = useRpcProvider()
  const { sdk } = rpc
  const isIceEnabled = useIsIceEnabled()

  const {
    swap: {
      split: { twapSlippage, twapMaxRetries },
    },
  } = useTradeSettings()

  const { createTransaction } = useTransactionsStore()
  const armNeckworkSync = useNeckworkSyncStore((state) => state.arm)

  return useMutation({
    mutationFn: async ([formValues, order]: [DcaFormValues, TradeDcaOrder]) => {
      const {
        sellAsset,
        buyAsset,
        sellAmount,
        orders,
        limitEnabled,
        limitPrice,
      } = formValues

      if (!account) throw new Error("Account not connected")
      if (!sellAsset || !buyAsset) throw new Error("Invalid DCA assets")

      const sellDecimals = sellAsset.decimals
      const sellSymbol = sellAsset.symbol
      const buySymbol = buyAsset.symbol
      const duration = getTimeFrameMillis(formValues.duration)
      const frequency = order.tradeCount > 0 ? duration / order.tradeCount : 0
      const isOpenBudget = orders.type === DcaOrdersMode.OpenBudget

      const minAmountOut =
        limitEnabled && limitPrice && Big(limitPrice).gt(0)
          ? BigInt(
              Big(order.tradeAmountIn.toString())
                .div(Big(10).pow(sellDecimals))
                .times(limitPrice)
                .times(Big(10).pow(buyAsset.decimals))
                .toFixed(0),
            )
          : undefined

      const iceOrder =
        minAmountOut !== undefined
          ? { ...order, assetOutEd: minAmountOut }
          : order

      let tx
      if (isIceEnabled) {
        tx = await sdk.tx
          .intentOrder(iceOrder)
          .withBeneficiary(account.address)
          .withSlippage(twapSlippage)
          .build()
      } else {
        tx = await sdk.tx
          .order(order)
          .withBeneficiary(account.address)
          .withSlippage(twapSlippage)
          .withMaxRetries(twapMaxRetries)
          .build()
      }

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
          tx: tx.get(),
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
          onSuccess: (event) => {
            if (isIceEnabled || rpc.isFork) return

            const blockHeight = getTxResultBlockHeight(event)
            if (blockHeight === null) return

            const planned = isSubstrateTxResult(event)
              ? (event.events.find(
                  (e) =>
                    e.type === "DCA" && e.value.type === "ExecutionPlanned",
                )?.value.value as { block: number } | undefined)
              : undefined

            armNeckworkSync(planned?.block ?? blockHeight + 1)
          },
        },
      )
    },
  })
}
