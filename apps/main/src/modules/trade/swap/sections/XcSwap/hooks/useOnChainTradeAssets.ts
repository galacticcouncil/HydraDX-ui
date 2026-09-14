import { useFormContext } from "react-hook-form"

import { TAssetData } from "@/api/assets"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { getXcAssetId } from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapAssets"
import { useAssets } from "@/providers/assetsProvider"

type OnChainTradeAssets = {
  readonly sellAsset: TAssetData | null
  readonly buyAsset: TAssetData | null
}

export const useOnChainTradeAssets = (): OnChainTradeAssets => {
  const { getAsset } = useAssets()
  const { watch } = useFormContext<XcSwapFormValues>()

  const [sellAsset, buyAsset] = watch(["sellAsset", "buyAsset"])

  return {
    sellAsset,
    buyAsset: getAsset(getXcAssetId(buyAsset) ?? "") ?? null,
  }
}
