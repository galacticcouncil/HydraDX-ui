import {
  Flex,
  Paper,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { pxToRem } from "@galacticcouncil/ui/utils"

import { ChartState } from "@/components/ChartState"
import { PoolDetailsHeaderSkeleton } from "@/modules/liquidity/components/PoolDetailsHeader/PoolDetailsHeaderSkeleton"
import { PoolDetailsValuesSkeleton } from "@/modules/liquidity/components/PoolDetailsValues/PoolDetailsValuesSkeleton"
import {
  chartTypes,
  types,
} from "@/modules/liquidity/components/PoolDetailsValues/PoolStats"

export const PoolDetailsSkeleton = () => {
  const { isTablet, isMobile } = useBreakpoints()

  if (isTablet || isMobile) {
    return (
      <Paper
        p={["secondary", "primary"]}
        as={Flex}
        sx={{ flex: 1, gap: "m", flexDirection: "column" }}
      >
        <ChartState sx={{ height: pxToRem(350) }} isLoading isEmpty />
        <Flex gap="base" justify="space-between" wrap align="center">
          <Flex align="center" gap="base">
            <ToggleGroup type="single" value="price" disabled>
              {chartTypes.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup type="single" fullWidth value="chart">
              {types.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id}>
                  {option.leadingElement}
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Flex>
        </Flex>
      </Paper>
    )
  }

  return (
    <Flex direction="column" position="relative">
      <PoolDetailsHeaderSkeleton />

      <Flex gap="xl">
        <Flex
          as={Paper}
          p={["secondary", "primary"]}
          align="center"
          flex={1}
          sx={{ flexBasis: pxToRem(500) }}
        >
          <ChartState sx={{ height: pxToRem(420) }} isLoading isEmpty />
        </Flex>
        <PoolDetailsValuesSkeleton />
      </Flex>
    </Flex>
  )
}
