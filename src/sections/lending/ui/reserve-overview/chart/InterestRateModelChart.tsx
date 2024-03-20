import { normalizeBN } from "@aave/math-utils"
import CustomDot from "assets/icons/ChartDot.svg?react"
import BigNumber from "bignumber.js"
import { PercentageValue } from "components/PercentageValue"
import { Text } from "components/Typography/Text/Text"
import { useMemo } from "react"
import {
  Area,
  AreaChart as AreaRecharts,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts"
import { getRates } from "sections/lending/ui/reserve-overview/chart/InterestRateModelChart.utils"
import { theme } from "theme"
import { ChartField } from "sections/lending/ui/reserve-overview/chart/ChartLegend"

type InterestRateModelType = {
  variableRateSlope1: string
  variableRateSlope2: string
  stableRateSlope1: string
  stableRateSlope2: string
  stableBorrowRateEnabled?: boolean
  optimalUsageRatio: string
  utilizationRate: string
  baseVariableBorrowRate: string
  baseStableBorrowRate: string
  totalLiquidityUSD: string
  totalDebtUSD: string
}

type ApyChartProps = {
  reserve: InterestRateModelType
  fields: ChartField[]
  tickField: ChartField
}

const CustomizedDot = ({ cx, cy }: { cx: number; cy: number }) => (
  <CustomDot x={cx - 17.5} y={cy - 17.5} />
)

export const InterestRateModelChart = ({
  reserve,
  tickField,
  fields = [],
}: ApyChartProps) => {
  const data = useMemo(() => getRates(reserve), [reserve])

  const optimalValue = normalizeBN(reserve.optimalUsageRatio, 27)
    .multipliedBy(100)
    .toNumber()

  const currentValue = new BigNumber(reserve.utilizationRate)
    .multipliedBy(100)
    .toNumber()

  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <ResponsiveContainer>
        <AreaRecharts data={data}>
          <defs>
            {fields.map(({ dataKey, lineColor }) => (
              <linearGradient
                key={dataKey}
                id={`color-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={theme.colors[lineColor ?? "brightBlue300"]}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={theme.colors[lineColor ?? "brightBlue300"]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <Tooltip
            content={(props) => <CustomTooltip {...props} fields={fields} />}
            cursor={{
              stroke: theme.colors.basic500,
              strokeWidth: 1,
              strokeDasharray: "4 2",
            }}
            wrapperStyle={{
              outline: "0",
            }}
          />
          <CartesianGrid
            vertical={false}
            stroke={theme.colors.darkBlue400}
            strokeDasharray="2 2"
            strokeWidth={1}
            opacity={0.5}
            shapeRendering="crispEdges"
          />
          {fields.map(({ dataKey, lineColor }) => (
            <Area
              key={dataKey}
              type="monotone"
              dataKey={dataKey}
              stroke={theme.colors[lineColor]}
              strokeWidth={2}
              fill={`url(#color-${dataKey})`}
              activeDot={(props) => <CustomizedDot {...props} />}
            />
          ))}
          <XAxis
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
            strokeWidth={1}
            dataKey="utilization"
            shapeRendering="crispEdges"
            stroke={theme.colors.darkBlue400}
            tick={{ fontSize: 11, fill: theme.colors.basic400 }}
            tickMargin={8}
            tickFormatter={(data) => `${Number(data).toFixed(0)}%`}
          />
          {fields.map(({ dataKey }) => (
            <YAxis
              key={dataKey}
              dataKey={dataKey}
              tick={{ fontSize: 11, fill: theme.colors.basic400 }}
              orientation="left"
              shapeRendering="crispEdges"
              width={40}
              stroke={theme.colors.darkBlue400}
              tickFormatter={(data) => `${Number(data * 100).toFixed(0)}%`}
              tickLine={false}
              axisLine={false}
            />
          ))}
          <ReferenceLine
            x={Math.round(optimalValue * 2) / 2}
            stroke={theme.colors[tickField.lineColor ?? "brightBlue300"]}
            strokeDasharray="4 2"
            shapeRendering="crispEdges"
            label={(props) => (
              <ReferenceLineLabel
                {...props}
                value={optimalValue}
                title="Optimal"
                color={theme.colors[tickField.lineColor ?? "brightBlue300"]}
              />
            )}
          />
          <ReferenceLine
            x={Math.round(currentValue * 2) / 2}
            stroke={theme.colors[tickField.lineColor ?? "brightBlue300"]}
            strokeDasharray="4 2"
            shapeRendering="crispEdges"
            height={80}
            label={(props) => (
              <ReferenceLineLabel
                {...props}
                value={currentValue}
                title="Current"
                offset={-10}
                color={theme.colors[tickField.lineColor ?? "brightBlue300"]}
              />
            )}
          />
        </AreaRecharts>
      </ResponsiveContainer>
    </div>
  )
}

const ReferenceLineLabel = (props: {
  value: number
  title: string
  offset?: number
  color: string
  viewBox: {
    x: number
    y: number
  }
}) => {
  return (
    <foreignObject
      sx={{ height: 24, width: 100 }}
      x={props.viewBox.x + 2}
      y={10 - (props.offset ?? 0)}
    >
      <div>
        <Text
          fs={10}
          lh={10}
          css={{ borderRadius: 20, color: props.color }}
          sx={{ bg: "darkBlue401", width: "fit-content", py: 2, px: 4 }}
        >
          {props.title} <PercentageValue value={props.value} />
        </Text>
      </div>
    </foreignObject>
  )
}

const CustomTooltip = ({
  active,
  payload,
  label,
  fields,
}: TooltipProps<number | string | Array<number | string>, string | number> & {
  fields: ChartField[]
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        css={{
          background: theme.colors.darkBlue400,
          border: 0,
          borderRadius: 4,
          outline: 0,
          padding: "10px 12px",
          color: "white",
        }}
      >
        <Text
          fs={14}
          sx={{ flex: "row", justify: "space-between", gap: [20, 60], mb: 4 }}
          font="ChakraPetchBold"
        >
          <span>Utilization Rate</span>
          <span>
            <PercentageValue minThreshold={0} value={Number(label)} />
          </span>
        </Text>
        {payload.map(({ value, dataKey }, index) =>
          value ? (
            <Text
              fs={14}
              key={dataKey}
              sx={{
                mt: 2,
                flex: "row",
                align: "center",
                justify: "space-between",
                gap: [20, 60],
              }}
            >
              <span
                sx={{
                  flex: "row",
                  align: "center",
                  justify: "space-between",
                  gap: 6,
                }}
              >
                <span
                  css={{ borderRadius: "100%" }}
                  sx={{
                    display: "block",
                    width: 10,
                    height: 10,
                    bg: fields[index]?.lineColor ?? "brightBlue300",
                  }}
                />
                {fields[index]?.text}
              </span>
              <span sx={{ textAlign: "right" }}>
                <PercentageValue value={Number(value) * 100} />
              </span>
            </Text>
          ) : null,
        )}
      </div>
    )
  }

  return null
}
