import { createFileRoute, redirect } from "@tanstack/react-router"

// Back-compat redirect: /strategies/propeller now maps to /strategies/propeller-<asset>.
export const Route = createFileRoute("/strategies/propeller/")({
  beforeLoad: () => {
    throw redirect({ to: "/strategies" })
  },
})
