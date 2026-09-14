import { useQuery } from "@tanstack/react-query"
import Big from "big.js"

import { bestSellQuery } from "@/api/trade"
import { TAsset } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

export type LimitFillStatus = {
  readonly orderRate: string | null
  readonly marketRate: string | null
  readonly distancePct: number | null
  readonly fillable: boolean
  readonly isLoading: boolean
}

type Args = {
  readonly from: TAsset
  readonly to: TAsset
  readonly sellAmount: string | null
  readonly receiveAmount: string | null
}

/** Fill status in "receive per sell" (to per from). Spot quote uses 1 unit; fill check uses the real slice size. */
export const useLimitFillStatus = ({
  from,
  to,
  sellAmount,
  receiveAmount,
}: Args): LimitFillStatus => {
  const rpc = useRpcProvider()

  const orderRate =
    sellAmount && receiveAmount && Big(sellAmount).gt(0)
      ? Big(receiveAmount).div(sellAmount)
      : null

  const { data: spotSwap, isLoading: spotLoading } = useQuery(
    bestSellQuery(rpc, {
      assetIn: from.id,
      assetOut: to.id,
      amountIn: sellAmount ? "1" : "0",
    }),
  )

  const { data: fillSwap, isLoading: fillLoading } = useQuery(
    bestSellQuery(rpc, {
      assetIn: from.id,
      assetOut: to.id,
      amountIn: sellAmount ?? "0",
    }),
  )

  const rateOf = (swap: typeof spotSwap) => {
    if (!swap) return null
    try {
      const inHuman = Big(swap.amountIn.toString()).div(
        Big(10).pow(from.decimals),
      )
      const outHuman = Big(swap.amountOut.toString()).div(
        Big(10).pow(to.decimals),
      )
      return inHuman.gt(0) ? outHuman.div(inHuman) : null
    } catch {
      return null
    }
  }

  const marketRate = rateOf(spotSwap)
  const fillRate = rateOf(fillSwap)

  const fillable = !!orderRate && !!fillRate && fillRate.gte(orderRate)

  const distancePct =
    orderRate && fillRate && fillRate.gt(0)
      ? orderRate.div(fillRate).minus(1).times(100).toNumber()
      : null

  return {
    orderRate: orderRate?.toString() ?? null,
    marketRate: marketRate?.toString() ?? null,
    distancePct,
    fillable,
    isLoading: spotLoading || fillLoading,
  }
}
