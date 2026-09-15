import { Flex, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"

export const StrategyHeader = () => {
  const { t } = useTranslation("strategies")
  const { bil } = useBilStrategy()

  return (
    <Flex justify="space-between" align="center" gap="s">
      <Flex align="center" gap="base">
        <AssetLogo id={bil.id} size="large" hideChain />
        <Flex direction="column">
          <Text
            font="primary"
            fs="h6"
            lh={1}
            fw={600}
            color={getToken("text.high")}
          >
            {t("bil.strategy.name")}
          </Text>
          <Text fs="p5" color={getToken("text.medium")}>
            {bil.symbol}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
