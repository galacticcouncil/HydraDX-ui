import { HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"
import { XcSwapClient } from "@galacticcouncil/xc-swap"
import { useMutation } from "@tanstack/react-query"
import { minutesToMilliseconds } from "date-fns"
import waitFor from "p-wait-for"
import { useTranslation } from "react-i18next"

import { useErc20Allowance } from "@/api/evm"
import { PendingApproval } from "@/components/PendingApproval"
import { XC_SWAP_CONFIG } from "@/config/xcSwap"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { isXcDestAsset } from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapAssets"
import {
  getXcSwapAmountIn,
  requireXcSwapRecipient,
  xcSwapQuoteQuery,
} from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapQuoteQuery"
import { XcAsset } from "@/modules/trade/swap/sections/XcSwap/types"
import { AnyTransaction } from "@/modules/transactions/types"
import { useRpcProvider } from "@/providers/rpcProvider"
import {
  TransactionActions,
  TransactionType,
  TransactionXcSwapMeta,
  useTransactionsStore,
} from "@/states/transactions"
import { getErrorMessage } from "@/utils/errors"

type UseSubmitXcSwapParams = {
  readonly xcSwap: XcSwapClient
  readonly originAssetMap: Map<string, XcAsset>
  readonly refundTo: string | null
  readonly swapSlippage: number
}

export const useSubmitXcSwap = (
  { xcSwap, originAssetMap, refundTo, swapSlippage }: UseSubmitXcSwapParams,
  actions?: TransactionActions,
) => {
  const { t } = useTranslation(["common", "trade"])
  const { queryClient } = useRpcProvider()
  const { createTransaction } = useTransactionsStore()
  const getErc20Allowance = useErc20Allowance()

  return useMutation({
    mutationFn: async (values: XcSwapFormValues) => {
      const { sellAsset, sellAmount, destChain, buyAsset, destAddress } = values

      if (!sellAsset) throw new Error("Source asset is required")
      if (!destChain) throw new Error("Destination chain is required")
      if (!buyAsset) throw new Error("Destination asset is required")
      if (!destAddress) throw new Error("Destination address is required")

      const recipient = requireXcSwapRecipient(destChain, destAddress)

      const trade = await queryClient.ensureQueryData(
        xcSwapQuoteQuery(xcSwap, {
          sellAsset,
          buyAsset: isXcDestAsset(buyAsset) ? buyAsset : null,
          amountIn: getXcSwapAmountIn(sellAsset, sellAmount),
          recipient,
          refundTo,
          slippage: swapSlippage,
          originAssetMap,
        }),
      )

      const buildErrorMeta: TransactionXcSwapMeta = {
        type: TransactionType.XcSwap,
        srcChainKey: HYDRATION_CHAIN_KEY,
        srcAssetSymbol: sellAsset.symbol,
        srcAmount: sellAmount,
        srcChainFee: trade.fee.amount.toDecimal(),
        srcChainFeeSymbol: trade.fee.amount.symbol,
        dstChainKey: destChain.key,
        dstAssetSymbol: buyAsset.symbol,
        dstAmount: trade.amountOut.toDecimal(),
        dstAddress: destAddress,
      }

      let calls: Awaited<ReturnType<typeof trade.buildCall>>["calls"]
      let depositAddress: string
      let correlationId: string | undefined
      try {
        const result = await trade.buildCall()
        calls = result.calls
        depositAddress = result.depositAddress
        correlationId = result.correlationId
      } catch (buildError) {
        return createTransaction(
          {
            initialError: getErrorMessage(buildError),
            meta: buildErrorMeta,
            // tx is unused when initialError is set; review modal skips signing.
            tx: {} as AnyTransaction,
          },
          actions,
        )
      }

      const swapAndBridge = calls[calls.length - 1]
      if (!swapAndBridge) throw new Error("Failed to build the swap call")
      const approve = calls.length > 1 ? calls[0] : undefined

      const i18nVars = {
        amount: sellAmount,
        symbol: sellAsset.symbol,
        srcSymbol: sellAsset.symbol,
        dstSymbol: buyAsset.symbol,
        dstChain: destChain.name,
      }

      const toasts = {
        submitted: t("trade:xc.swap.toast.submitted", i18nVars),
        success: t("trade:xc.swap.toast.success", i18nVars),
      }

      const meta: TransactionXcSwapMeta = {
        ...buildErrorMeta,
        depositAddress,
        correlationId,
      }

      if (approve) {
        return createTransaction(
          {
            tx: [
              {
                tx: approve,
                stepTitle: t("trade:xc.swap.step.approve"),
                toasts: {
                  submitted: t("trade:xc.swap.approve.toast.submitted", {
                    symbol: i18nVars.srcSymbol,
                  }),
                  success: t("trade:xc.swap.approve.toast.success", {
                    symbol: i18nVars.srcSymbol,
                  }),
                },
                meta: {
                  type: TransactionType.EvmApprove,
                  srcChainKey: HYDRATION_CHAIN_KEY,
                },
                pendingComponent: PendingApproval,
                // The approve has to be visible to the node the swap is priced
                // and executed against — a mined receipt on the wallet's rpc
                // isn't that. The swap step stays out of reach until then, fee
                // estimation included.
                beforeNext: async () => {
                  await waitFor(
                    async () => {
                      const allowance = await getErc20Allowance(
                        approve.to,
                        approve.from,
                        XC_SWAP_CONFIG.emitter,
                      )
                      return allowance >= trade.amountIn.amount
                    },
                    {
                      interval: 1000,
                      timeout: {
                        milliseconds: minutesToMilliseconds(3),
                        message: t("trade:xc.swap.approve.timeout"),
                      },
                    },
                  )
                },
              },
              {
                tx: swapAndBridge,
                stepTitle: t("swap"),
                toasts,
                meta,
              },
            ],
          },
          actions,
        )
      }

      return createTransaction({ tx: swapAndBridge, toasts, meta }, actions)
    },
  })
}
