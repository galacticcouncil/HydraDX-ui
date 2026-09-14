import { createFileRoute, redirect } from "@tanstack/react-router"

import { swapTabLink } from "@/config/navigation"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ ...swapTabLink("market"), replace: true })
  },
})
