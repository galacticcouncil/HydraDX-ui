import {
  Box,
  Button,
  Flex,
  Paper,
  PositionCard,
  Separator,
  Text,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"

interface Props {
  shares: number
  exchangeRate: number
  apy: number | null
  onWithdraw: () => void
}

export const MyPositionsCard = ({
  shares,
  exchangeRate,
  apy,
  onWithdraw,
}: Props) => {
  const { t } = useTranslation(["propeller", "common"])
  const { assetId, symbol, shareSymbol } = useActivePropellerVault()

  const assetValue = shares * exchangeRate

  return (
    <Paper>
      <Box p="l">
        <Text as="h2" font="primary" fs="p2" fw={500}>
          {t("positions.title")}
        </Text>
      </Box>
      <Separator />
      <Flex direction="column" gap="m" p="m">
        <PositionCard
          logo={<AssetLogo id={assetId} size="medium" hideChain />}
          symbol={symbol}
          stats={
            <>
              <ValueStats
                wrap
                size="small"
                font="secondary"
                label={t("positions.col.amount")}
                customValue={
                  <Text fs="p3" fw={500} lh={1}>
                    {t("common:currency", {
                      value: shares,
                      symbol: shareSymbol,
                    })}
                  </Text>
                }
                bottomLabel={t("common:currency", {
                  value: assetValue,
                  symbol,
                })}
              />
              <ValueStats
                wrap
                size="small"
                font="secondary"
                label={t("positions.col.netApy")}
                customValue={
                  <Text fs="p3" fw={500} lh={1}>
                    {apy === null
                      ? "—"
                      : t("common:percent", {
                          value: apy,
                        })}
                  </Text>
                }
              />
            </>
          }
          cta={
            <Button variant="tertiary" size="small" onClick={onWithdraw}>
              {t("positions.action.withdraw")}
            </Button>
          }
        />
      </Flex>
    </Paper>
  )
}
