import { createFileRoute, redirect } from "@tanstack/react-router"

// Back-compat redirect from /strategies/propeller/$asset to /strategies/propeller-<asset>.
export const Route = createFileRoute("/strategies/propeller/$asset/")({
  beforeLoad: () => {
    throw redirect({ to: "/strategies" })
  },
})
