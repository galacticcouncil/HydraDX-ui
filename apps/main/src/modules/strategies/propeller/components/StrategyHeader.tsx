import { Flex, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import {
  StrategyBadge,
  StrategyBadgeType,
} from "@/modules/strategies/components/StrategyBadge/StrategyBadge"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"

export const StrategyHeader = () => {
  const { t } = useTranslation("propeller")
  const vault = useActivePropellerVault()

  return (
    <Flex justify="space-between" align="center" gap="s" wrap>
      <Flex align="center" gap="base">
        <AssetLogo id={vault.assetId} size="large" hideChain />
        <Text
          font="primary"
          fs="h6"
          lh={1}
          fw={600}
          color={getToken("text.high")}
        >
          {t("strategy.name", { symbol: vault.symbol })}
        </Text>
      </Flex>

      <Flex align="center" gap="s" wrap>
        <StrategyBadge size="large" type={StrategyBadgeType.PropellerVault} />
        <StrategyBadge size="large" type={StrategyBadgeType.Leverage} />
        <StrategyBadge size="large" type={StrategyBadgeType.NoLiquidation} />
      </Flex>
    </Flex>
  )
}
