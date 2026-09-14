import type { XcSwapAsset, XcSwapChain } from "@galacticcouncil/xc-swap"

import { TAssetData } from "@/api/assets"
import { TradeType } from "@/api/trade"

export type XcAsset = XcSwapAsset & {
  name: string
  logo: string
  balance?: string
  balanceUsd?: string
}

export type XcChain = XcSwapChain & {
  logo: string
  addressValidator: (addr: string) => boolean
}

export type XcChainAssetPair = {
  chain: XcChain
  asset: XcAsset
}

export type SwapSubmitValues = {
  sellAsset: TAssetData | null
  sellAmount: string
  buyAsset: TAssetData | null
  buyAmount: string
  type: TradeType
  isSingleTrade: boolean
}
