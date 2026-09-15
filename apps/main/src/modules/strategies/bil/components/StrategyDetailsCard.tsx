import { MoveUpRight } from "@galacticcouncil/ui/assets/icons"
import {
  Box,
  ExternalLink,
  Flex,
  Grid,
  Icon,
  Paper,
  ResponsiveScope,
  Separator,
  Summary,
  SummaryRow,
  Text,
  Tooltip,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { neckwork, shortenAccountAddress } from "@galacticcouncil/utils"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { AssetProgressStat } from "@/components/AssetProgressStat"
import {
  SDetailsStatItem,
  SDetailsStatsContainer,
  SDetailsStatsSeparator,
} from "@/modules/strategies/bil/components/StrategyDetailsCard.styled"
import { VAULT_ADDRESS } from "@/modules/strategies/bil/config/constants"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { useBilReserveConfig } from "@/modules/strategies/bil/hooks/useBilPoolPosition"
import { useBilStrategyMetrics } from "@/modules/strategies/bil/hooks/useBilStrategyMetrics"

export const StrategyDetailsCard = () => {
  const { t } = useTranslation(["strategies", "borrow", "common"])
  const { hollar, bil, bilReserve } = useBilStrategy()
  const {
    data: metrics,
    isVaultStatsPending,
    isReserveConfigLoading,
  } = useBilStrategyMetrics()
  const { data: reserveConfig } = useBilReserveConfig()

  const hasGlobalBorrowCap = (reserveConfig?.borrowCapHollar ?? 0) > 0
  const showBorrowCap = isReserveConfigLoading || hasGlobalBorrowCap
  const borrowCapHollar = reserveConfig?.borrowCapHollar ?? 0
  const totalBorrowedHollar = reserveConfig?.totalDebtHollar ?? 0
  const totalBorrowed = Math.max(
    0,
    borrowCapHollar > 0
      ? Math.min(totalBorrowedHollar, borrowCapHollar)
      : totalBorrowedHollar,
  )
  const borrowedPct =
    borrowCapHollar > 0 ? (totalBorrowed / borrowCapHollar) * 100 : 0

  return (
    <Paper>
      <Box p="l">
        <Text as="h2" font="primary" fs="base" fw={500}>
          {t("details.title")}
        </Text>
      </Box>
      <Separator />

      <ResponsiveScope>
        <SDetailsStatsContainer>
          <SDetailsStatItem>
            <ValueStats
              wrap
              isLoading={isVaultStatsPending}
              label={t("bil.strategy.tvl")}
              customValue={
                <Flex align="center" gap="s">
                  <AssetLogo id={bil.id} size="medium" hideChain />
                  <Text
                    font="primary"
                    fs="h6"
                    fw={600}
                    color={getToken("text.high")}
                  >
                    {t("common:currency.compact", { value: metrics.tvl })}
                  </Text>
                </Flex>
              }
            />
          </SDetailsStatItem>

          <SDetailsStatsSeparator />

          <SDetailsStatItem>
            <ValueStats
              wrap
              isLoading={isVaultStatsPending || isReserveConfigLoading}
              label={t("bil.strategy.maxNetApy")}
              customValue={
                <Text
                  font="primary"
                  fs="h6"
                  fw={600}
                  color={getToken("accents.success.emphasis")}
                >
                  {t("common:percent", {
                    value: metrics.maxNetApyPct,
                  })}
                </Text>
              }
            />
          </SDetailsStatItem>

          {showBorrowCap && (
            <>
              <SDetailsStatsSeparator />
              <SDetailsStatItem>
                <ValueStats
                  sx={{ alignSelf: "center" }}
                  wrap
                  isLoading={isReserveConfigLoading}
                  label={t("common:totalBorrowed")}
                  customValue={
                    reserveConfig ? (
                      <AssetProgressStat
                        assetId={hollar.id}
                        progressPct={borrowedPct}
                        value={
                          <Text
                            font="primary"
                            fs="h6"
                            fw={600}
                            color={getToken("text.high")}
                            minWidth="10rem"
                          >
                            {t("common:number", { value: totalBorrowed })}
                          </Text>
                        }
                      />
                    ) : null
                  }
                />
              </SDetailsStatItem>
            </>
          )}
        </SDetailsStatsContainer>
      </ResponsiveScope>

      <Separator />

      <Grid columnGap="l" columnTemplate={["1fr", null, null, "1fr 1fr"]} p="l">
        <Summary withTrailingSeparator justify="flex-start">
          <SummaryRow
            label={t("bil.strategy.collateralAssetLabel")}
            content={
              <Flex align="center" gap="s">
                <AssetLogo id={bilReserve.id} size="small" hideChain />
                <Text fs="p4" lh={1.5}>
                  {t("bil.strategy.collateralAsset")}
                </Text>
              </Flex>
            }
          />
          <SummaryRow
            label={t("bil.strategy.debtAssetLabel")}
            content={
              <Flex align="center" gap="s">
                <AssetLogo id={hollar.id} size="small" hideChain />
                <Text fs="p4" lh={1.5}>
                  {hollar.symbol}
                </Text>
              </Flex>
            }
          />
          <SummaryRow
            label={t("bil.strategy.contractAddress")}
            content={
              <Text fs="p4" lh={1.5} whiteSpace="nowrap">
                <Tooltip text={t("common:openInExplorer")} size="small" asChild>
                  <ExternalLink href={neckwork.contract(VAULT_ADDRESS)}>
                    {shortenAccountAddress(VAULT_ADDRESS)}
                    <Icon component={MoveUpRight} size="xs" />
                  </ExternalLink>
                </Tooltip>
              </Text>
            }
          />
        </Summary>
        <Summary withTrailingSeparator justify="flex-start">
          <SummaryRow
            label={t("borrow:maxLTV")}
            content={
              <Text fs="p4" lh={1.5}>
                {t("common:percent", {
                  value: metrics.maxLtvPct,
                })}
              </Text>
            }
          />
          <SummaryRow
            label={t("bil.strategy.liquidationLtv")}
            content={
              <Text fs="p4" lh={1.5}>
                {t("common:percent", {
                  value: metrics.liquidationLtvPct,
                })}
              </Text>
            }
          />
        </Summary>
      </Grid>
    </Paper>
  )
}
