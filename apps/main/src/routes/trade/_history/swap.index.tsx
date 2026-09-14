import { createFileRoute, Navigate } from "@tanstack/react-router"

import { swapTabLink } from "@/config/navigation"
import { SwapPageSkeleton } from "@/modules/trade/swap/SwapPageSkeleton"

export const Route = createFileRoute("/trade/_history/swap/")({
  pendingComponent: SwapPageSkeleton,
  component: () => <Navigate {...swapTabLink("market")} />,
})
