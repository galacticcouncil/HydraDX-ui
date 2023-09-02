import { Navigate, useMatchRoute } from "@tanstack/react-location"
import { Page } from "components/Layout/Page/Page"
import { Spacer } from "components/Spacer/Spacer"
import { Heading } from "components/Typography/Heading/Heading"
import { useTranslation } from "react-i18next"
import { StakingDashboard } from "./sections/dashboard/StakingDashboard"
import { LINKS } from "utils/navigation"
import { Navigation } from "./components/Navigation"
import { Voting } from "./sections/voting/Voting"

const pageEnabled = import.meta.env.VITE_FF_STAKING_ENABLED === "true"

export const StakingPage = () => {
  const { t } = useTranslation()
  const matchRoute = useMatchRoute()

  if (!pageEnabled) return <Navigate to="/trade" />

  const isReferendaPage = matchRoute({ to: LINKS.stakingVote })

  return (
    <Page subHeader={isReferendaPage ? <Navigation /> : null}>
      {isReferendaPage ? (
        <Voting />
      ) : (
        <>
          <Heading as="h1" fs={19} lh={19} fw={500}>
            {t("staking.title")}
          </Heading>
          <Spacer size={35} />
          <StakingDashboard />
        </>
      )}
    </Page>
  )
}
