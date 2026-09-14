import { ChartLine, ChartPie } from "@galacticcouncil/ui/assets/icons"
import {
  Flex,
  Icon,
  Paper,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { ComponentProps, ReactNode, useState } from "react"

import i18n from "@/i18n"

type PoolStatsType = "chart" | "stats"

type PoolStatsTabOption = {
  readonly id: PoolStatsType
  readonly label: string
  readonly leadingElement?: ReactNode
}

export const types: ReadonlyArray<PoolStatsTabOption> = [
  {
    id: "chart",
    label: i18n.t("chart"),
    leadingElement: <Icon size="s" component={ChartLine} />,
  },
  {
    id: "stats",
    label: i18n.t("stats"),
    leadingElement: <Icon size="s" component={ChartPie} />,
  },
]

export type PoolStatsShellProps = {
  renderChart: (isMobile: boolean) => ReactNode
  values: ReactNode
  renderChartHeader?: (isMobile: boolean) => ReactNode
  mb?: ComponentProps<typeof Flex>["mb"]
  sx?: ComponentProps<typeof Flex>["sx"]
}

export const PoolStatsShell = ({
  renderChart,
  values,
  renderChartHeader,
  mb,
  sx,
}: PoolStatsShellProps) => {
  const { isTablet, isMobile } = useBreakpoints()
  const [type, setType] = useState<PoolStatsType>("chart")

  if (isTablet || isMobile) {
    const header = renderChartHeader?.(true)

    return (
      <Paper
        p={["secondary", "primary"]}
        mb={mb}
        as={Flex}
        sx={{ flex: 1, gap: "m", flexDirection: "column", ...sx }}
      >
        <Flex direction="column" gap="base" sx={{ flexShrink: 0 }}>
          <ToggleGroup
            type="single"
            fullWidth
            value={type}
            onValueChange={(value) => value && setType(value as PoolStatsType)}
          >
            {types.map((option) => (
              <ToggleGroupItem key={option.id} value={option.id}>
                {option.leadingElement}
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {type === "chart" && header && (
            <Flex justify="flex-end">{header}</Flex>
          )}
        </Flex>
        {type === "chart" ? (
          <Flex flex={1} direction="column" sx={{ minHeight: 0 }}>
            {renderChart(true)}
          </Flex>
        ) : (
          values
        )}
      </Paper>
    )
  }

  const header = renderChartHeader?.(false)

  return (
    <Flex gap="xl" mb={mb} sx={sx}>
      <Paper
        p={["secondary", "primary"]}
        flex={2.5}
        as={Flex}
        sx={{ flexDirection: "column" }}
      >
        {header && (
          <Flex sx={{ flexShrink: 0 }} mb="l">
            {header}
          </Flex>
        )}
        <Flex flex={1} direction="column" sx={{ minHeight: 0 }}>
          {renderChart(false)}
        </Flex>
      </Paper>

      <Paper p={["secondary", "primary"]} flex={1}>
        {values}
      </Paper>
    </Flex>
  )
}
