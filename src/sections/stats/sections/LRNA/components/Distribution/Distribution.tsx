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
import { DEPOSIT_CLASS_ID, OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { SContainerVertical } from "sections/stats/StatsPage.styled"
import { useTotalIssuance } from "api/totalIssuance"
import { useTokenBalance } from "api/balances"
import { BN_0 } from "utils/constants"
import { useAssets } from "providers/assets"

export const Distribution = () => {
  const { t } = useTranslation()
  const { hub } = useAssets()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const meta = hub

  const totalIssuanceQuery = useTotalIssuance(meta.id)
  const omnipoolBalanceQuery = useTokenBalance(
    meta.id,
    OMNIPOOL_ACCOUNT_ADDRESS,
  )

  const symbol = meta?.symbol

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
        data={totalIssuanceQuery.data?.total}
        isLoading={totalIssuanceQuery.isLoading}
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
          data={omnipoolBalanceQuery.data?.total}
          isLoading={omnipoolBalanceQuery.isLoading}
          compact={true}
        />
        <TotalValue
          title={t("stats.lrna.pie.values.outside")}
          data={outsideOmnipool}
          isLoading={isLoading}
          compact={true}
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
                      symbol={symbol}
                      percentage={insidePercent?.toNumber() ?? 0}
                    />
                  ),
                  percentage: insidePercent?.toNumber() ?? 0,
                  color: "#A6DDFF",
                  name: "in",
                  id: DEPOSIT_CLASS_ID,
                },
                {
                  label: (
                    <DistributionSliceLabel
                      text={t("stats.lrna.distribution.outside")}
                      symbol={symbol}
                      percentage={outsidePercent?.toNumber() ?? 0}
                    />
                  ),
                  percentage: outsidePercent?.toNumber() ?? 0,
                  color: "#2489FF",
                  name: "out",
                  id: DEPOSIT_CLASS_ID,
                },
              ]}
              label={ChartLabel}
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
