import LinkIcon from "assets/icons/LinkIcon.svg?react"
import { DataValue } from "components/DataValue"
import { PercentageValue } from "components/PercentageValue"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { NetworkConfig } from "sections/lending/ui-config/networksConfig"
import { InterestRateModelChartContainer } from "sections/lending/ui/reserve-overview/chart/InterestRateModelChartContainer"

export type InterestRateModelInfoProps = {
  reserve: ComputedReserveData
  currentNetworkConfig: NetworkConfig
}

export const InterestRateModelInfo: React.FC<InterestRateModelInfoProps> = ({
  reserve,
  currentNetworkConfig,
}) => {
  return (
    <div>
      <div
        sx={{
          flex: ["column", "row"],
          align: ["start", "center"],
          justify: "space-between",
          gap: 20,
          mb: 20,
        }}
      >
        <DataValue
          label="Utilization Rate"
          labelColor="basic400"
          font="ChakraPetchBold"
        >
          <PercentageValue value={Number(reserve.borrowUsageRatio) * 100} />
        </DataValue>
        <a
          target="_blank"
          href={currentNetworkConfig.explorerLinkBuilder({
            address: reserve.interestRateStrategyAddress,
          })}
          rel="noreferrer"
          css={{ textDecoration: "underline" }}
          sx={{ color: "basic500", fontSize: 14 }}
        >
          Interest rate strategy
          <LinkIcon width={10} height={10} sx={{ ml: 4 }} />
        </a>
      </div>
      <InterestRateModelChartContainer reserve={reserve} />
    </div>
  )
}
