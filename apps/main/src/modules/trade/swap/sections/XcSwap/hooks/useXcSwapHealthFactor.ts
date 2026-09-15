import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { UseFormReturn } from "react-hook-form"

import { healthFactorQuery } from "@/api/aave"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

type UseXcSwapHealthFactorParams = {
  rpc: ReturnType<typeof useRpcProvider>
  form: UseFormReturn<XcSwapFormValues>
  account: ReturnType<typeof useAccount>["account"]
  isCrossChain: boolean
}

export const useXcSwapHealthFactor = ({
  rpc,
  form,
  account,
  isCrossChain,
}: UseXcSwapHealthFactorParams) => {
  const { getAsset } = useAssets()

  const sellAsset = form.watch("sellAsset")
  const buyAsset = form.watch("buyAsset")
  const sellAmount = form.watch("sellAmount")
  const buyAmount = form.watch("buyAmount")

  const [debouncedAmountIn] = useDebouncedValue(sellAmount)
  const [debouncedAmountOut] = useDebouncedValue(buyAmount)

  // OnChain only: resolve the Hydration buy asset (CrossChain has no Aave dest)
  const healthFactorToAsset =
    !isCrossChain && buyAsset?.id !== undefined
      ? (getAsset(String(buyAsset.id)) ?? null)
      : null

  const { data: healthFactor, isLoading: isHealthFactorLoading } = useQuery(
    healthFactorQuery(rpc, {
      fromAsset: sellAsset,
      fromAmount: debouncedAmountIn,
      toAsset: healthFactorToAsset,
      toAmount: debouncedAmountOut,
      address: account?.address ?? "",
    }),
  )

  return { healthFactor, isHealthFactorLoading }
}
