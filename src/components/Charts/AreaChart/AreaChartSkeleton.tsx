import { AreaChart as AreaRecharts, Area, ResponsiveContainer } from "recharts"
import {
  ChartState,
  TChartState,
} from "components/Charts/components/ChartState"
import { theme } from "theme"

const points = [
  14, 22, 36, 0, 15, 22, 35, 27, 50, 70, 74, 56, 41, 67, 82, 102, 107, 85, 121,
  126, 127, 120, 126, 142, 134, 159, 197, 201, 221, 215, 185, 171, 152, 169,
  160, 152, 156, 156, 136, 104, 119, 115, 107, 152, 146, 161, 165, 143, 153,
  150, 172, 192, 197, 211, 224, 222, 205, 183, 179, 170, 164, 177, 195, 169,
  180, 180, 141, 126, 142, 119, 113, 143, 153, 152, 156, 118, 104, 114, 104,
  115, 119, 105, 87, 90, 89, 111, 112, 128, 147, 137, 143, 130, 103, 100, 105,
  128, 145,
]

const skeletonData = points.map((el) => ({ y: el + 100 }))

export const AreaChartSkeleton = ({
  state,
  color = "brightBlue300",
}: {
  state: TChartState
  color?: keyof typeof theme.colors
}) => {
  return (
    <div sx={{ mb: [50, 100], width: "100%", height: [200, 229] }}>
      <ChartState state={state} />
      <ResponsiveContainer css={{ filter: "blur(12px)", height: 229 }}>
        <AreaRecharts data={skeletonData}>
          <defs>
            <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={theme.colors[color]}
                stopOpacity={0.8}
              />
              <stop offset="95%" stopColor="#000" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke={theme.colors[color]}
            fill="url(#color)"
            animationDuration={0}
          />
        </AreaRecharts>
      </ResponsiveContainer>
    </div>
  )
}
