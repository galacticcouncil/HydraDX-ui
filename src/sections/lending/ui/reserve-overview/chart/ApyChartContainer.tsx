import { ToggleGroup, ToggleGroupItem } from "components/ToggleGroup"
import { useState } from "react"
import type { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import {
  ESupportedTimeRanges,
  ReserveRateTimeRange,
  useReserveRatesHistory,
} from "sections/lending/hooks/useReservesHistory"
import { ApyChart } from "sections/lending/ui/reserve-overview/chart/ApyChart"
import {
  ChartField,
  ChartLegend,
} from "sections/lending/ui/reserve-overview/chart/ChartLegend"
import { MarketDataType } from "sections/lending/utils/marketsAndNetworksConfig"

type ApyChartType = "supply" | "borrow"

type ApyChartContainerProps = {
  type: ApyChartType
  reserve: ComputedReserveData
  currentMarketData: MarketDataType
}

const CHART_HEIGHT = 200

export const ApyChartContainer = ({
  type,
  reserve,
  currentMarketData,
}: ApyChartContainerProps): JSX.Element => {
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<ReserveRateTimeRange>(ESupportedTimeRanges.OneMonth)

  let reserveAddress = ""
  if (reserve) {
    if (currentMarketData.v3) {
      reserveAddress = `${reserve.underlyingAsset}${currentMarketData.addresses.LENDING_POOL_ADDRESS_PROVIDER}${currentMarketData.chainId}`
    } else {
      reserveAddress = `${reserve.underlyingAsset}${currentMarketData.addresses.LENDING_POOL_ADDRESS_PROVIDER}`
    }
  }
  const { data, loading, error } = useReserveRatesHistory(
    reserveAddress,
    selectedTimeRange,
  )

  const supplyFields: ChartField[] = [
    {
      dataKey: "liquidityRate",
      lineColor: "brightBlue300",
      text: "Supply APR",
    },
  ]

  const borrowFields: ChartField[] = [
    ...(reserve.stableBorrowRateEnabled
      ? ([
          {
            dataKey: "stableBorrowRate",
            lineColor: "pink300",
            text: "Borrow APR, stable",
          },
        ] as const)
      : []),
    {
      dataKey: "variableBorrowRate",
      lineColor: "pink600",
      text: "Borrow APR, variable",
    },
  ]

  const fields = type === "supply" ? supplyFields : borrowFields

  return (
    <div sx={{ mt: 10, mb: 16 }} css={{ position: "relative" }}>
      <div
        sx={{
          px: [0, 8],
          flex: ["column-reverse", "row"],
          align: ["start", "center"],
          justify: "space-between",
          flexWrap: "wrap",
          mb: 12,
          gap: 12,
        }}
      >
        <ChartLegend fields={fields} />
        <ToggleGroup
          size="extra-small"
          variant="tertiary"
          type="single"
          value={selectedTimeRange}
          onValueChange={(value: ESupportedTimeRanges) =>
            setSelectedTimeRange(value)
          }
        >
          <ToggleGroupItem value={ESupportedTimeRanges.OneMonth}>
            1m
          </ToggleGroupItem>
          <ToggleGroupItem value={ESupportedTimeRanges.SixMonths}>
            6m
          </ToggleGroupItem>
          <ToggleGroupItem value={ESupportedTimeRanges.OneYear}>
            1y
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div sx={{ height: CHART_HEIGHT }}>
        <ApyChart
          loading={loading}
          error={error}
          data={data}
          fields={fields}
          avgFieldName={
            type === "supply" ? "liquidityRate" : "variableBorrowRate"
          }
        />
      </div>
    </div>
  )
}
