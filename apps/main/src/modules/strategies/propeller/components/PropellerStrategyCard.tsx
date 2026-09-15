import { useTranslation } from "react-i18next"

import { StrategyBadgeType } from "@/modules/strategies/components/StrategyBadge/StrategyBadge"
import { StrategyCard } from "@/modules/strategies/components/StrategyCard/StrategyCard"
import {
  PROPELLER_VAULT_ROUTE,
  type PropellerVaultConfig,
} from "@/modules/strategies/propeller/config/vaults"
import { usePropellerApy } from "@/modules/strategies/propeller/hooks/useVaultReads"

export const PropellerStrategyCard = ({
  vault,
}: {
  vault: PropellerVaultConfig
}) => {
  const { t } = useTranslation(["common", "strategies"])
  // Overview page has no vault provider; pass the config in explicitly.
  const apy = usePropellerApy(vault)

  return (
    <StrategyCard
      logoId={vault.assetId}
      title={t("strategies:cards.propeller.title", { symbol: vault.symbol })}
      description={t("strategies:cards.propeller.description", {
        symbol: vault.symbol,
      })}
      stats={[
        {
          label: t("apy"),
          value: apy !== null ? t("common:percent", { value: apy }) : "-",
        },
      ]}
      badges={[
        StrategyBadgeType.PropellerVault,
        StrategyBadgeType.Leverage,
        StrategyBadgeType.NoLiquidation,
      ]}
      link={PROPELLER_VAULT_ROUTE[vault.key]}
    />
  )
}
