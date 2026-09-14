import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { Navigate, useMatchRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"

import { swapTabLink } from "@/config/navigation"
import { IntentsOnboardingModal } from "@/modules/trade/swap/components/IntentsOnboardingModal"
import { useResetSharedSellAmountOnUnmount } from "@/modules/trade/swap/lib/useSharedSellAmount"
import { SwapPageSkeleton } from "@/modules/trade/swap/SwapPageSkeleton"
import { useIsIceEnabled } from "@/states/intents"

const SwapPageDesktop = lazy(async () => ({
  default: await import("@/modules/trade/swap/SwapPageDesktop").then(
    (m) => m.SwapPageDesktop,
  ),
}))

const SwapPageMobile = lazy(async () => ({
  default: await import("@/modules/trade/swap/SwapPageMobile").then(
    (m) => m.SwapPageMobile,
  ),
}))

export const SwapPage = () => {
  useResetSharedSellAmountOnUnmount()

  const { gte } = useBreakpoints()
  const isIceEnabled = useIsIceEnabled()
  const matchRoute = useMatchRoute()
  const isLimitPage = !!matchRoute(swapTabLink("limit"))

  const content =
    isLimitPage && !isIceEnabled ? (
      <Navigate {...swapTabLink("market")} />
    ) : !gte("lg") ? (
      <SwapPageMobile />
    ) : (
      <SwapPageDesktop />
    )

  return (
    <>
      <Suspense fallback={<SwapPageSkeleton />}>{content}</Suspense>
      <IntentsOnboardingModal />
    </>
  )
}
