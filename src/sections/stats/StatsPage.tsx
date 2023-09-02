import { Navigate, useMatchRoute } from "@tanstack/react-location"
import { Page } from "components/Layout/Page/Page"
import { Spacer } from "components/Spacer/Spacer"
import { Heading } from "components/Typography/Heading/Heading"
import { useTranslation } from "react-i18next"
import { LINKS } from "utils/navigation"
import { StatsLRNA } from "./sections/LRNA/StatsLRNA"
import { StatsPOL } from "./sections/POL/StatsPOL"
import { StatsOverview } from "./sections/overview/StatsOverview"
import { StatsTabs } from "./components/tabs/StatsTabs"
import {
  OmnipoolAssetNavigation,
  StatsOmnipoolAsset,
} from "./sections/omnipoolAsset/StatsOmnipoolAsset"

const pageEnabled = import.meta.env.VITE_FF_STATS_ENABLED === "true"

export const StatsPage = () => {
  const { t } = useTranslation()
  const matchRoute = useMatchRoute()

  if (!pageEnabled) return <Navigate to="/trade" />

  const isOmnipoolAssetPage = matchRoute({ to: LINKS.statsOmnipool })

  return (
    <Page
      variant="stats"
      subHeader={isOmnipoolAssetPage ? <OmnipoolAssetNavigation /> : null}
      css={isOmnipoolAssetPage && { padding: "10px!important" }}
    >
      {!isOmnipoolAssetPage && (
        <>
          <Heading as="h1" fs={30} lh={30} fw={500}>
            {t("stats.title")}
          </Heading>
          <Spacer size={42} />
          <StatsTabs />
          <Spacer size={30} />
        </>
      )}

      {matchRoute({ to: LINKS.statsOverview }) && <StatsOverview />}
      {matchRoute({ to: LINKS.statsPOL }) && <StatsPOL />}
      {matchRoute({ to: LINKS.statsLRNA }) && <StatsLRNA />}
      {isOmnipoolAssetPage && <StatsOmnipoolAsset />}
    </Page>
  )
}
