import { Grid, SectionHeader } from "@galacticcouncil/ui/components"
import { BIL_ERC20_ID } from "@galacticcouncil/utils"
import { useTranslation } from "react-i18next"

import { useBondData } from "@/api/bonds"
import { LINKS } from "@/config/navigation"
import { useBilStrategyMetrics } from "@/modules/strategies/bil/hooks/useBilStrategyMetrics"
import { StrategyBadgeType } from "@/modules/strategies/components/StrategyBadge/StrategyBadge"
import { StrategyCard } from "@/modules/strategies/components/StrategyCard/StrategyCard"
import { PropellerStrategyCard } from "@/modules/strategies/propeller/components/PropellerStrategyCard"
import { PROPELLER_VAULTS } from "@/modules/strategies/propeller/config/vaults"
import { STABLE_BONDS } from "@/modules/strategies/stable-bonds/config/bonds"
import { useStableBonds } from "@/modules/strategies/stable-bonds/hooks/useStableBonds"
import {
  isStableBondSoldOut,
  useStableBondsOtcOrders,
} from "@/modules/strategies/stable-bonds/hooks/useStableBondsOtcOrders"
import {
  getBondApr,
  getDefaultBondApr,
} from "@/modules/strategies/stable-bonds/utils/apr"
import { useRpcProvider } from "@/providers/rpcProvider"

export const StrategiesPage = () => {
  const { t } = useTranslation(["common", "strategies"])
  const { featureFlags } = useRpcProvider()
  const { active } = useStableBonds()
  const bondId = active?.id ?? ""
  const bondConfig = STABLE_BONDS[bondId]
  const { timeLeft } = useBondData(bondId)
  const { data: orders, isReady } = useStableBondsOtcOrders(
    bondId,
    bondConfig?.otcAcceptedAssetIds ?? [],
    bondConfig?.otcOfferIds ?? [],
  )
  const isSoldOut = isStableBondSoldOut(orders, isReady)
  const bondApr = isSoldOut
    ? getDefaultBondApr(bondId)
    : getBondApr(bondId, timeLeft)

  const { data: bilMetrics, isLoading: isBilMetricsLoading } =
    useBilStrategyMetrics()

  return (
    <>
      <SectionHeader title={t("strategies:page.title")} noTopPadding />
      <Grid
        columnTemplate={["1fr", null, "repeat(2, 1fr)", null, "repeat(4, 1fr)"]}
        gap="xl"
      >
        {featureFlags.propellerEnabled &&
          Object.values(PROPELLER_VAULTS).map((vault) => (
            <PropellerStrategyCard key={vault.key} vault={vault} />
          ))}
        {featureFlags.bilEnabled && (
          <StrategyCard
            logoId={BIL_ERC20_ID}
            title={t("strategies:cards.bil.title")}
            stats={[
              {
                label: t("apy"),
                value: t("common:percent", { value: bilMetrics.maxNetApyPct }),
                isLoading: isBilMetricsLoading,
              },
            ]}
            badges={[StrategyBadgeType.Partnership, StrategyBadgeType.RWA]}
            description={t("strategies:cards.bil.description")}
            link={LINKS.strategiesBil}
          />
        )}

        {featureFlags.hollarBondsEnabled && (
          <StrategyCard
            logoId={bondId}
            title={t("strategies:cards.hollarBonds.title")}
            stats={[
              {
                label: t("apr"),
                value:
                  bondApr !== null
                    ? t("common:percent", {
                        value: bondApr,
                        suffix: isSoldOut ? "+" : undefined,
                      })
                    : "-",
              },
            ]}
            badges={[StrategyBadgeType.FixedYield]}
            description={t("strategies:cards.hollarBonds.description")}
            link={LINKS.strategiesHollarBonds}
          />
        )}
      </Grid>
    </>
  )
}
