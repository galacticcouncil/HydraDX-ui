import { MoveUpRight } from "@galacticcouncil/ui/assets/icons"
import {
  Box,
  ExternalLink,
  Flex,
  Icon,
  Paper,
  ResponsiveScope,
  Separator,
  SummaryRow,
  Text,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import {
  HYDRATION_CHAIN_KEY,
  shortenAccountAddress,
  subscan,
} from "@galacticcouncil/utils"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { AssetProgressStat } from "@/components/AssetProgressStat"
import {
  SDetailsStatItem,
  SDetailsStatsContainer,
  SDetailsStatsSeparator,
} from "@/modules/strategies/propeller/components/StrategyDetailsCard.styled"
import { PROPELLER_RISK_PROFILE } from "@/modules/strategies/propeller/config/vaults"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { usePropellerApy } from "@/modules/strategies/propeller/hooks/useVaultReads"
import { useAssetPrice } from "@/states/displayAsset"

interface VaultStats {
  totalAssets: number
  tvlCap: number
}

interface Props {
  vaultStats: VaultStats
}

export const StrategyDetailsCard = ({ vaultStats }: Props) => {
  const { t } = useTranslation(["propeller", "common"])
  const vault = useActivePropellerVault()
  const { price } = useAssetPrice(vault.assetId)
  const apr = usePropellerApy()

  const { totalAssets, tvlCap } = vaultStats
  const tvlDisplay = totalAssets * Number(price || 0)
  const hasCap = tvlCap > 0
  const remainingCapacity = Math.max(tvlCap - totalAssets, 0)
  const remaining = Math.max(
    0,
    hasCap ? Math.min(remainingCapacity, tvlCap) : remainingCapacity,
  )
  const remainingPct = hasCap ? (remaining / tvlCap) * 100 : 0

  return (
    <Paper>
      <Box p="l">
        <Text as="h2" font="primary" fs="p2" fw={500}>
          {t("strategy.title")}
        </Text>
      </Box>
      <Separator />

      <ResponsiveScope>
        <SDetailsStatsContainer>
          <SDetailsStatItem>
            <ValueStats
              wrap
              label={t("strategy.tvl")}
              customValue={
                <Flex align="center" gap="s">
                  <AssetLogo id={vault.assetId} size="medium" hideChain />
                  <Text
                    font="primary"
                    fs="h6"
                    fw={600}
                    color={getToken("text.high")}
                  >
                    {t("common:currency.compact", { value: tvlDisplay })}
                  </Text>
                </Flex>
              }
            />
          </SDetailsStatItem>

          <SDetailsStatsSeparator />

          <SDetailsStatItem>
            <ValueStats
              wrap
              label={t("strategy.netApy")}
              customValue={
                <Text
                  font="primary"
                  fs="h6"
                  fw={600}
                  color={getToken(
                    apr === null ? "text.high" : "accents.success.emphasis",
                  )}
                >
                  {apr === null
                    ? "—"
                    : t("common:percent", {
                        prefix: "+",
                        value: apr,
                        maximumFractionDigits: 2,
                      })}
                </Text>
              }
            />
          </SDetailsStatItem>

          {hasCap && (
            <>
              <SDetailsStatsSeparator />
              <SDetailsStatItem>
                <ValueStats
                  sx={{ alignSelf: "center" }}
                  wrap
                  label={t("strategy.remainingCapacity")}
                  customValue={
                    <AssetProgressStat
                      assetId={vault.assetId}
                      progressPct={remainingPct}
                      value={
                        <Text
                          font="primary"
                          fs="h6"
                          fw={600}
                          color={getToken("text.high")}
                          minWidth="10rem"
                        >
                          {t("common:currency.compact", {
                            value: remaining,
                            symbol: vault.symbol,
                            maximumFractionDigits: remaining > 100_000 ? 0 : 2,
                          })}
                        </Text>
                      }
                    />
                  }
                />
              </SDetailsStatItem>
            </>
          )}

          <SDetailsStatsSeparator />

          <SDetailsStatItem>
            <ValueStats
              wrap
              label={t("strategy.riskProfile")}
              customValue={
                <Text
                  font="primary"
                  fs="h6"
                  fw={600}
                  color={getToken("text.high")}
                >
                  {t(`strategy.risk.${PROPELLER_RISK_PROFILE}`)}
                </Text>
              }
            />
          </SDetailsStatItem>
        </SDetailsStatsContainer>
      </ResponsiveScope>

      <Separator />

      <Box p="l">
        <SummaryRow
          label={t("strategy.contractAddress")}
          content={
            <Text fs="p4" lh={1.5}>
              <ExternalLink
                href={subscan.account(HYDRATION_CHAIN_KEY, vault.vaultAddress)}
              >
                {shortenAccountAddress(vault.vaultAddress)}
                <Icon component={MoveUpRight} size="xs" />
              </ExternalLink>
            </Text>
          }
        />
      </Box>
    </Paper>
  )
}
