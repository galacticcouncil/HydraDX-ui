import { createFileRoute } from "@tanstack/react-router"

import { getPageMeta } from "@/config/navigation"
import { PROPELLER_VAULTS } from "@/modules/strategies/propeller/config/vaults"
import { PropellerVaultPage } from "@/modules/strategies/propeller/PropellerVaultPage"

export const Route = createFileRoute("/strategies/propeller-eth/")({
  component: () => <PropellerVaultPage vault={PROPELLER_VAULTS.eth} />,
  staticData: { crumb: true },
  head: ({
    match: {
      context: { i18n },
    },
  }) => ({
    meta: getPageMeta("strategiesPropellerEth", i18n.t),
  }),
})
