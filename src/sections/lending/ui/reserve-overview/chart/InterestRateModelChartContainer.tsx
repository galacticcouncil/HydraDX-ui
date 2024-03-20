import type { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import {
  ChartField,
  ChartLegend,
} from "sections/lending/ui/reserve-overview/chart/ChartLegend"
import { InterestRateModelChart } from "sections/lending/ui/reserve-overview/chart/InterestRateModelChart"

type InteresetRateModelGraphContainerProps = {
  reserve: ComputedReserveData
}

const CHART_HEIGHT = 200

export const InterestRateModelChartContainer = ({
  reserve,
}: InteresetRateModelGraphContainerProps) => {
  const yAxisFields: ChartField[] = [
    {
      dataKey: "variableRate",
      text: "Borrow APR, variable",
      lineColor: "pink600",
    },
    ...(reserve.stableBorrowRateEnabled
      ? ([
          {
            dataKey: "stableRate",
            text: "Borrow APR, stable",
            lineColor: "pink400",
          },
        ] as const)
      : []),
  ]

  const tickField: ChartField = {
    dataKey: "utilization",
    text: "Utilization Rate",
    lineColor: "brightBlue300",
  }

  return (
    <div sx={{ mt: 8 }}>
      <div
        sx={{
          px: 8,
          flex: "row",
          align: "center",
          justify: "space-between",
          mb: 20,
        }}
      >
        <ChartLegend fields={[...yAxisFields, tickField]} />
      </div>
      <div sx={{ height: CHART_HEIGHT }}>
        <InterestRateModelChart
          fields={yAxisFields}
          tickField={tickField}
          reserve={{
            baseStableBorrowRate: reserve.baseStableBorrowRate,
            baseVariableBorrowRate: reserve.baseVariableBorrowRate,
            optimalUsageRatio: reserve.optimalUsageRatio,
            stableRateSlope1: reserve.stableRateSlope1,
            stableRateSlope2: reserve.stableRateSlope2,
            utilizationRate: reserve.borrowUsageRatio,
            variableRateSlope1: reserve.variableRateSlope1,
            variableRateSlope2: reserve.variableRateSlope2,
            stableBorrowRateEnabled: reserve.stableBorrowRateEnabled,
            totalLiquidityUSD: reserve.totalLiquidityUSD,
            totalDebtUSD: reserve.totalDebtUSD,
          }}
        />
      </div>
    </div>
  )
}
