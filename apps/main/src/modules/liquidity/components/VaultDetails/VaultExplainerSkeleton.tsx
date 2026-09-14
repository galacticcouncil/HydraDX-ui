import {
  Flex,
  Paper,
  ResponsiveScope,
  Separator,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { ChartState } from "@/components/ChartState"
import {
  SChartPreview,
  SExplainerSplit,
  SExplainerSplitDivider,
  SScenarioPanel,
} from "@/modules/liquidity/components/VaultDetails/VaultExplainer.styled"

export const VaultExplainerSkeleton = () => {
  const { t } = useTranslation("liquidity")

  const options = [
    t("vaults.explainer.states.inRange"),
    t("vaults.explainer.states.outOfRange"),
    t("vaults.explainer.states.recentered"),
  ]

  return (
    <Paper p="l" flex={2.5} minWidth={0}>
      <Skeleton width={220} height="1.5em" />

      <Flex direction="column" gap="xs" mt="m">
        <Skeleton width="100%" height={14} />
        <Skeleton width="92%" height={14} />
      </Flex>

      <Flex mt="m">
        <Skeleton width={180} height={12} />
      </Flex>

      <Flex mt="m">
        <ToggleGroup type="single" fullWidth value={options[0]} disabled>
          {options.map((option) => (
            <ToggleGroupItem key={option} value={option}>
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Flex>

      <ResponsiveScope mt="l">
        <SExplainerSplit>
          <SChartPreview direction="column" justify="center">
            <ChartState sx={{ height: 180 }} isLoading isEmpty />
          </SChartPreview>

          <SExplainerSplitDivider />

          <SScenarioPanel direction="column" gap="m">
            <Flex direction="column" gap="s">
              <Skeleton width="70%" height="1.2em" />
              <Skeleton width="100%" height={14} />
              <Skeleton width="88%" height={14} />
            </Flex>

            {Array.from({ length: 2 }, (_, index) => (
              <Paper key={index} borderRadius="m" shadow={false} p="m">
                <Flex align="flex-start" gap="m">
                  <Skeleton width={24} height={24} />
                  <Flex direction="column" gap="xs" flex={1}>
                    <Skeleton width="55%" height={14} />
                    <Skeleton width="100%" height={12} />
                    <Skeleton width="80%" height={12} />
                  </Flex>
                </Flex>
              </Paper>
            ))}
          </SScenarioPanel>
        </SExplainerSplit>
      </ResponsiveScope>

      <Separator my="m" />
      <Skeleton width="95%" height={12} />
    </Paper>
  )
}
