import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { UseFormReturn } from "react-hook-form"

import { healthFactorQuery } from "@/api/aave"
import { dcaOrderQuery } from "@/api/trade"
import {
  DcaFormValues,
  DcaOrdersMode,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { toDecimal } from "@/utils/formatting"

export const useDcaTradeOrder = (form: UseFormReturn<DcaFormValues>) => {
  const rpc = useRpcProvider()
  const { getAsset } = useAssets()

  const { account } = useAccount()
  const address = account?.address ?? ""

  const formValues = form.watch()

  const { data: order, isLoading: isOrderLoading } = useQuery(
    dcaOrderQuery(rpc, formValues),
  )

  const assetInId = order?.assetIn
  const assetOutId = order?.assetOut
  const assetInMeta = assetInId ? getAsset(assetInId) : undefined
  const assetOutMeta = assetOutId ? getAsset(assetOutId) : undefined

  const isOpenBudget = formValues.orders.type === DcaOrdersMode.OpenBudget

  const { data: healthFactorData, isLoading: isHealthFactorLoading } = useQuery(
    healthFactorQuery(rpc, {
      fromAsset: formValues.sellAsset,
      fromAmount:
        order && assetInMeta
          ? isOpenBudget
            ? toDecimal(
                order.tradeAmountIn * OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER,
                assetInMeta.decimals,
              )
            : formValues.sellAmount
          : "0",
      toAsset: formValues.buyAsset,
      toAmount:
        order && assetOutMeta
          ? isOpenBudget
            ? toDecimal(
                order.tradeAmountOut * OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER,
                assetOutMeta.decimals,
              )
            : toDecimal(order.amountOut, assetOutMeta.decimals)
          : "0",
      address,
    }),
  )

  return {
    order,
    healthFactor: healthFactorData,
    isLoading: isOrderLoading || isHealthFactorLoading,
  }
}

const OPEN_BUDGET_LOCKED_TRADES_MULTIPLIER = 3n
