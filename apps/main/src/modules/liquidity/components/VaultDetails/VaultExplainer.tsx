import {
  Flex,
  Icon,
  Paper,
  ResponsiveScope,
  Select,
  Separator,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { getToken } from "@galacticcouncil/ui/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  LiquidityDistribution,
  RangeScenario,
} from "@/modules/liquidity/components/VaultDetails/LiquidityDistribution"
import {
  SChartPreview,
  SExplainerSplit,
  SExplainerSplitDivider,
  SScenarioPanel,
} from "@/modules/liquidity/components/VaultDetails/VaultExplainer.styled"
import {
  getScenarioCopy,
  getScenarioOptions,
  isRangeScenario,
} from "@/modules/liquidity/components/VaultDetails/VaultExplainer.utils"
import { VaultTable } from "@/modules/liquidity/Vaults.utils"

export const VaultExplainer = ({ vault }: { vault: VaultTable }) => {
  const { t } = useTranslation("liquidity")
  const { isMobile, isTablet } = useBreakpoints()
  const [scenario, setScenario] = useState<RangeScenario>("inRange")
  const isCompact = isMobile || isTablet

  const options = getScenarioOptions(t)
  const copy = getScenarioCopy(t)
  const selected = copy[scenario]

  return (
    <Paper p="l" flex={2.5} minWidth={0}>
      <Text as="h2" fs="p2" fw={500} font="primary">
        {t("vaults.explainer.title")}
      </Text>
      <Flex direction="column" gap="xs" mt="m">
        <Text fs="p5" color={getToken("text.medium")}>
          {t("vaults.explainer.intro")}
        </Text>
        <Text fs="p5" color={getToken("text.medium")}>
          {t("vaults.explainer.introDetails")}
        </Text>
      </Flex>
      <Text fs="p6" color={getToken("text.low")} pt="m">
        {t("vaults.explainer.hint")}
      </Text>

      <Flex mt="m" justify={isCompact ? "end" : "start"}>
        {isCompact ? (
          <Select
            value={scenario}
            items={options}
            onValueChange={setScenario}
          />
        ) : (
          <ToggleGroup
            type="single"
            value={scenario}
            onValueChange={(value) =>
              isRangeScenario(value) && setScenario(value)
            }
          >
            {options.map((option) => (
              <ToggleGroupItem key={option.key} value={option.key}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </Flex>

      <ResponsiveScope mt="l">
        <SExplainerSplit>
          <SChartPreview direction="column">
            <LiquidityDistribution
              vault={vault}
              scenario={scenario}
              height={230}
            />
          </SChartPreview>

          <SExplainerSplitDivider />

          <SScenarioPanel key={scenario} direction="column" gap="m">
            <Flex direction="column" gap="s">
              <Text as="h3" fs="p2" fw={500} font="primary">
                {selected.title}
              </Text>
              <Text fs="p5" color={getToken("text.medium")}>
                {selected.description}
              </Text>
            </Flex>

            {selected.facts.map((fact) => (
              <Flex key={fact.title} align="flex-start" gap="m" asChild>
                <Paper borderRadius="m" shadow={false} p="m">
                  <Icon
                    component={fact.icon}
                    size="m"
                    color={getToken("buttons.primary.high.rest")}
                    mt="xs"
                  />
                  <Flex direction="column" gap="xs">
                    <Text fs="p5" fw={600}>
                      {fact.title}
                    </Text>
                    <Text fs="p6" color={getToken("text.low")}>
                      {fact.description}
                    </Text>
                  </Flex>
                </Paper>
              </Flex>
            ))}
          </SScenarioPanel>
        </SExplainerSplit>
      </ResponsiveScope>

      <Separator my="m" />
      <Text fs="p6" color={getToken("text.low")}>
        {t("vaults.explainer.footer")}
      </Text>
    </Paper>
  )
}
