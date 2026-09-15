import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { UseFormReturn } from "react-hook-form"

import { healthFactorQuery } from "@/api/aave"
import { dcaTradeOrderQuery } from "@/api/trade"
import {
  DcaFormValues,
  DcaOrdersMode,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { toDecimal } from "@/utils/formatting"

export const useDcaTradeOrder = (form: UseFormReturn<DcaFormValues>) => {
  const rpc = useRpcProvider()
  const { getAsset } = useAssets()

  const { account } = useAccount()
  const address = account?.address ?? ""

  const {
    dca: { slippage, maxRetries },
  } = useTradeSettings()

  const formValues = form.watch()

  const { data: orderData, isLoading: isOrderLoading } = useQuery(
    dcaTradeOrderQuery(rpc, {
      form: formValues,
      slippage,
      maxRetries,
      address,
      dryRun: form.formState.isValid,
    }),
  )

  const assetInId = orderData?.order?.assetIn
  const assetOutId = orderData?.order?.assetOut
  const assetInMeta = assetInId ? getAsset(assetInId) : undefined
  const assetOutMeta = assetOutId ? getAsset(assetOutId) : undefined

  const isOpenBudget = formValues.orders.type === DcaOrdersMode.OpenBudget

  const { data: healthFactorData, isLoading: isHealthFactorLoading } = useQuery(
    healthFactorQuery(rpc, {
      fromAsset: formValues.sellAsset,
      fromAmount:
        orderData && assetInMeta && orderData.order
          ? isOpenBudget
            ? toDecimal(
                orderData.order.tradeAmountIn *
                  OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER,
                assetInMeta.decimals,
              )
            : formValues.sellAmount
          : "0",
      toAsset: formValues.buyAsset,
      toAmount:
        orderData && assetOutMeta && orderData.order
          ? isOpenBudget
            ? toDecimal(
                orderData.order.tradeAmountOut *
                  OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER,
                assetOutMeta.decimals,
              )
            : toDecimal(orderData.order.amountOut, assetOutMeta.decimals)
          : "0",
      address,
    }),
  )

  return {
    order: orderData?.order,
    dryRunError: orderData?.dryRunError ?? null,
    healthFactor: healthFactorData,
    isLoading: isOrderLoading || isHealthFactorLoading,
  }
}

const OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER = 3n
