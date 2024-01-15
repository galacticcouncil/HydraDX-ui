import { TotalValue } from "./TotalValue"
import { PieSkeleton } from "sections/stats/components/PieChart/components/Skeleton/Skeleton"
import { ChartSwitchMobile } from "sections/stats/components/ChartSwitchMobile/ChartSwitchMobile"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useState } from "react"
import { ChartWrapper } from "sections/stats/sections/LRNA/components/ChartWrapper/ChartWrapper"
import { useTranslation } from "react-i18next"
import { ChartLabel } from "./ChartLabel"
import { DoughnutChart } from "sections/stats/components/DoughnutChart/DoughnutChart"
import { makePercent } from "./Distribution.utils"
import { DistributionSliceLabel } from "./DistributionSliceLabel"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { SContainerVertical } from "sections/stats/StatsPage.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useTotalIssuance } from "api/totalIssuance"
import { useTokenBalance } from "api/balances"
import { BN_0 } from "utils/constants"

export const Distribution = () => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const totalIssuanceQuery = useTotalIssuance(assets.hub.id)
  const omnipoolBalanceQuery = useTokenBalance(
    assets.hub.id,
    OMNIPOOL_ACCOUNT_ADDRESS,
  )

  const [activeSection, setActiveSection] = useState<"overview" | "chart">(
    "overview",
  )

  const isLoading =
    totalIssuanceQuery.isLoading || omnipoolBalanceQuery.isLoading

  const outsideOmnipool =
    totalIssuanceQuery.data && omnipoolBalanceQuery.data
      ? totalIssuanceQuery.data.total.minus(omnipoolBalanceQuery.data.total)
      : undefined

  const outsidePercent = makePercent(
    outsideOmnipool,
    totalIssuanceQuery.data?.total ?? BN_0,
  )
  const insidePercent = makePercent(
    omnipoolBalanceQuery.data?.total ?? BN_0,
    totalIssuanceQuery.data?.total ?? BN_0,
  )

  const pieChartValues = (
    <div sx={{ flex: "column", gap: 20 }}>
      <TotalValue
        title={t("stats.lrna.pie.values.total")}
        data={totalIssuanceQuery.data?.total.shiftedBy(-assets.hub.decimals)}
        isLoading={totalIssuanceQuery.isLoading}
        compact
      />
      <div
        sx={{
          flex: ["row", "column"],
          justify: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <TotalValue
          title={t("stats.lrna.pie.values.inside")}
          data={insidePercent}
          isLoading={isLoading}
          percentage
        />
        <TotalValue
          title={t("stats.lrna.pie.values.outside")}
          data={outsidePercent}
          isLoading={isLoading}
          percentage
        />
      </div>
    </div>
  )

  return (
    <SContainerVertical sx={{ width: ["100%", "fit-content"], p: [20, 40] }}>
      {!isDesktop && (
        <ChartSwitchMobile onClick={setActiveSection} active={activeSection} />
      )}

      {activeSection === "overview" ? (
        !isLoading ? (
          <>
            <DoughnutChart
              slices={[
                {
                  label: (
                    <DistributionSliceLabel
                      text={t("stats.lrna.distribution.inside")}
                      symbol={assets.hub.symbol}
                      percentage={insidePercent?.toNumber() ?? 0}
                    />
                  ),
                  percentage: insidePercent?.toNumber() ?? 0,
                  color: "#A6DDFF",
                  name: "in",
                  id: `in_${assets.hub.id}`,
                },
                {
                  label: (
                    <DistributionSliceLabel
                      text={t("stats.lrna.distribution.outside")}
                      symbol={assets.hub.symbol}
                      percentage={outsidePercent?.toNumber() ?? 0}
                    />
                  ),
                  percentage: outsidePercent?.toNumber() ?? 0,
                  color: "#2489FF",
                  name: "out",
                  id: `out_${assets.hub.id}`,
                },
              ]}
              label={<ChartLabel />}
            />
            {pieChartValues}
          </>
        ) : (
          <>
            <PieSkeleton />
            {pieChartValues}
          </>
        )
      ) : (
        <ChartWrapper />
      )}
    </SContainerVertical>
  )
}
