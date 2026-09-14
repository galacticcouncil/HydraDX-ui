import {
  HOLLAR_ASSET_ID,
  HYDRATION_CHAIN_KEY,
  SELL_ONLY_ASSETS,
} from "@galacticcouncil/utils"
import type { XcSwapPlatform } from "@galacticcouncil/xc-swap"
import { createFileRoute } from "@tanstack/react-router"
import * as z from "zod/v4"

import { tradeOrderTabs } from "@/modules/trade/orders/TradeOrders/TradeOrdersHeader"
import { NATIVE_ASSET_ID } from "@/utils/consts"
import { isHydrationAssetId } from "@/utils/trade"

export const DEFAULT_TRADE_ASSET_IN_ID = HOLLAR_ASSET_ID
export const DEFAULT_TRADE_ASSET_OUT_ID = NATIVE_ASSET_ID

const XC_SWAP_PLATFORMS = [
  "hydration",
  "near",
  "zec",
] as const satisfies readonly XcSwapPlatform[]

const searchSchema = z
  .object({
    tab: z.enum(tradeOrderTabs).default("myActivity"),
    assetIn: z
      .string()
      .default(DEFAULT_TRADE_ASSET_IN_ID)
      .catch(DEFAULT_TRADE_ASSET_IN_ID),
    assetOut: z
      .string()
      .default(DEFAULT_TRADE_ASSET_OUT_ID)
      .catch(DEFAULT_TRADE_ASSET_OUT_ID),
    destPlatform: z
      .enum(XC_SWAP_PLATFORMS)
      .default(HYDRATION_CHAIN_KEY)
      .catch(HYDRATION_CHAIN_KEY),
    allPairs: z.boolean().default(true),
    page: z.number().optional(),
  })
  .overwrite((search) => {
    if (
      search.assetIn === search.assetOut ||
      SELL_ONLY_ASSETS.includes(search.assetOut)
    ) {
      return {
        ...search,
        assetIn: DEFAULT_TRADE_ASSET_IN_ID,
        assetOut: DEFAULT_TRADE_ASSET_OUT_ID,
        destPlatform: HYDRATION_CHAIN_KEY,
      }
    }

    if (
      isHydrationAssetId(search.assetOut) &&
      search.destPlatform !== HYDRATION_CHAIN_KEY
    ) {
      return {
        ...search,
        destPlatform: HYDRATION_CHAIN_KEY,
      }
    }

    return search
  })

export type TradeHistorySearchParams = z.infer<typeof searchSchema>

export const isCrossChainSwapSearch = ({
  assetIn,
  assetOut,
  destPlatform,
}: Pick<TradeHistorySearchParams, "assetIn" | "assetOut" | "destPlatform">) =>
  destPlatform !== HYDRATION_CHAIN_KEY ||
  !isHydrationAssetId(assetIn) ||
  !isHydrationAssetId(assetOut)

export const normalizeSearchForOnChainSwapTab = (
  search: TradeHistorySearchParams,
): TradeHistorySearchParams => {
  if (!isCrossChainSwapSearch(search)) {
    return search
  }

  let assetIn = isHydrationAssetId(search.assetIn)
    ? search.assetIn
    : DEFAULT_TRADE_ASSET_IN_ID
  let assetOut = isHydrationAssetId(search.assetOut)
    ? search.assetOut
    : DEFAULT_TRADE_ASSET_OUT_ID

  if (assetIn === assetOut) {
    if (assetIn === DEFAULT_TRADE_ASSET_IN_ID) {
      assetOut = DEFAULT_TRADE_ASSET_OUT_ID
    } else {
      assetIn = DEFAULT_TRADE_ASSET_IN_ID
    }
  }

  return {
    ...search,
    assetIn,
    assetOut,
    destPlatform: HYDRATION_CHAIN_KEY,
  }
}

export const Route = createFileRoute("/trade/_history")({
  validateSearch: searchSchema,
})
