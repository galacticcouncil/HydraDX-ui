import CustomDot from "assets/icons/ChartDot.svg?react"
import { AreaChartSkeleton } from "components/Charts/AreaChart/AreaChartSkeleton"
import { PercentageValue } from "components/PercentageValue"
import { Text } from "components/Typography/Text/Text"
import { format } from "date-fns"
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
import { FormattedReserveHistoryItem } from "sections/lending/hooks/useReservesHistory"
import { ChartField } from "sections/lending/ui/reserve-overview/chart/ChartLegend"
import { theme } from "theme"

type ApyChartProps = {
  data: FormattedReserveHistoryItem[]
  loading: boolean
  error: boolean
  fields: ChartField[]
  avgFieldName: keyof FormattedReserveHistoryItem
}

const CustomizedDot = ({ cx, cy }: { cx: number; cy: number }) => (
  <CustomDot x={cx - 17.5} y={cy - 17.5} />
)

export const ApyChart = ({
  data,
  loading,
  error,
  fields = [],
  avgFieldName,
}: ApyChartProps) => {
  const avg = useMemo(() => {
    if (!data?.length || !avgFieldName) return -1
    return data.reduce((acc, cur) => acc + cur[avgFieldName], 0) / data.length
  }, [avgFieldName, data])

  const mainColor = fields?.[0]?.lineColor

  if (loading) return <AreaChartSkeleton color={mainColor} state="loading" />
  if (error) return <AreaChartSkeleton color={mainColor} state="error" />
  if (!data?.length)
    return <AreaChartSkeleton color={mainColor} state="noData" />

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
            dataKey="date"
            strokeWidth={1}
            shapeRendering="crispEdges"
            stroke={theme.colors.darkBlue400}
            tick={{ fontSize: 11, fill: theme.colors.basic400 }}
            tickMargin={8}
            minTickGap={50}
            tickFormatter={(data) => {
              const date = new Date(data)
              return format(date, "MMM  dd")
            }}
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
              tickFormatter={(data) => {
                const value = Number(data * 100)
                return `${value.toFixed(2).replace(".00", "")}%`
              }}
              tickLine={false}
              axisLine={false}
            />
          ))}

          {avg >= 0 && (
            <ReferenceLine
              y={avg}
              stroke={theme.colors.basic500}
              strokeDasharray="4 2"
              shapeRendering="crispEdges"
              label={(props) => <AvgLine {...props} value={avg} />}
            />
          )}
        </AreaRecharts>
      </ResponsiveContainer>
    </div>
  )
}

const AvgLine = (props: {
  value: number
  viewBox: {
    x: number
    y: number
  }
}) => {
  return (
    <foreignObject
      sx={{ height: 24, width: 100 }}
      x={45}
      y={props.viewBox.y - 24}
    >
      <Text
        fs={12}
        lh={12}
        css={{ borderRadius: 20 }}
        sx={{ bg: "darkBlue400", width: "fit-content", px: 6, py: 4 }}
      >
        Avg <PercentageValue value={props.value * 100} />
      </Text>
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
        <Text fs={12} color="basic400">
          {format(new Date(label), "MMM dd yyyy, HH:mm")}
        </Text>
        {payload.map(({ value, dataKey }, index) =>
          value ? (
            <Text
              fs={16}
              key={dataKey}
              sx={{ mt: 2, flex: "row", align: "center", gap: 6 }}
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
              <PercentageValue value={Number(value) * 100} />
            </Text>
          ) : null,
        )}
      </div>
    )
  }

  return null
}
