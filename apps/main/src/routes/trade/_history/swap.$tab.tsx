import { createFileRoute, redirect } from "@tanstack/react-router"

import { SwapPageSkeleton } from "@/modules/trade/swap/SwapPageSkeleton"
import { SwapTabPage } from "@/modules/trade/swap/SwapTabPage"
import {
  normalizeSearchForOnChainSwapTab,
  TradeHistorySearchParams,
} from "@/routes/trade/_history/route"

const ON_CHAIN_SWAP_TABS = new Set(["limit", "twap"])

export const Route = createFileRoute("/trade/_history/swap/$tab")({
  beforeLoad: ({ params, search }) => {
    if (!ON_CHAIN_SWAP_TABS.has(params.tab)) return

    const normalized = normalizeSearchForOnChainSwapTab(
      search as TradeHistorySearchParams,
    )

    if (
      normalized.assetIn !== search.assetIn ||
      normalized.assetOut !== search.assetOut ||
      normalized.destPlatform !== search.destPlatform
    ) {
      throw redirect({
        search: normalized,
        replace: true,
      })
    }
  },
  component: SwapTabPage,
  pendingComponent: SwapPageSkeleton,
})
