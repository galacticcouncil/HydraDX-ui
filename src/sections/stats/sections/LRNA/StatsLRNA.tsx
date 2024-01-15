import { ChartWrapper } from "./components/ChartWrapper/ChartWrapper"
import { useMedia } from "react-use"
import { theme } from "theme"
import { Distribution } from "./components/Distribution/Distribution"
// TODO: Not ready. Requested in #861n9ffe4
// import { StatsTiles } from "sections/stats/components/StatsTiles/StatsTiles"
import { RecentTradesTableWrapper } from "sections/stats/components/RecentTradesTable/RecentTradesTableWrapper"
import { StatusBar } from "./sections/StatusBar"
import { SContainerVertical } from "sections/stats/StatsPage.styled"
import { PageHeading } from "components/Layout/PageHeading"
import { Spacer } from "components/Spacer/Spacer"
import { StatsTabs } from "sections/stats/components/tabs/StatsTabs"
import { useTranslation } from "react-i18next"
import { useRpcProvider } from "providers/rpcProvider"

const StatsLRNAData = () => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <>
      <PageHeading>{t("stats.title")}</PageHeading>
      <Spacer size={[20, 30]} />
      <StatsTabs />
      <Spacer size={30} />
      <div sx={{ flex: "column", gap: 50 }}>
        <div sx={{ flex: "row", gap: 20 }}>
          <Distribution />
          {isDesktop && (
            <SContainerVertical
              sx={{
                width: "100%",
                p: 24,
              }}
            >
              <ChartWrapper />
            </SContainerVertical>
          )}
        </div>
        <StatusBar />
        {/* TODO: Not ready. Requested in #861n9ffe4 */}
        {/*<StatsTiles />*/}
        <RecentTradesTableWrapper assetId={assets.hub.id} />
      </div>
    </>
  )
}

export const StatsLRNA = () => {
  const { isLoaded } = useRpcProvider()

  if (!isLoaded) return null
  return <StatsLRNAData />
}
