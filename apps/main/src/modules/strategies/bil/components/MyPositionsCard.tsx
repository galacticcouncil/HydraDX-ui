import {
  Box,
  Button,
  Flex,
  MicroButton,
  Paper,
  PositionCard,
  Separator,
  Text,
  Tooltip,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { useEvmAddress } from "@galacticcouncil/web3-connect"
import Big from "big.js"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { WithdrawModal } from "@/modules/strategies/bil/components/WithdrawModal"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { useBilPoolPosition } from "@/modules/strategies/bil/hooks/useBilPoolPosition"
import {
  useUserBalances,
  useVaultStats,
} from "@/modules/strategies/bil/hooks/useVaultReads"
import { useSupplyRawBil } from "@/modules/strategies/bil/hooks/useVaultWrites"

export type PositionRow = {
  id: "supplied" | "raw"
  label: string
  amount: string
  usdValue: string
  netWorthUsd: string
  netApyPercent: number
  isRaw: boolean
}

export const MyPositionsCard = () => {
  const { t } = useTranslation(["strategies", "borrow", "common"])
  const { bil } = useBilStrategy()
  const evmAddress = useEvmAddress()

  const [withdrawSource, setWithdrawSource] = useState<
    PositionRow["id"] | null
  >(null)

  const { data: stats } = useVaultStats()
  const { data: balances } = useUserBalances(evmAddress)
  const { data: poolPosition } = useBilPoolPosition(evmAddress)
  const supplyRawMutation = useSupplyRawBil()

  const bilSupplied = balances?.bilSupplied ?? "0"
  const bilRaw = balances?.bilRaw ?? "0"
  const exchangeRate = stats.exchangeRate
  const apyPercent = stats.apr

  const netWorthUsd = Big.max(
    Big(poolPosition?.totalCollateralUsd ?? 0).minus(
      poolPosition?.totalDebtUsd ?? 0,
    ),
    0,
  ).toString()

  const hasSupplied = Big(bilSupplied).gt(0)
  const hasRaw = Big(bilRaw).gt(0)

  const rows: PositionRow[] = []
  if (hasSupplied) {
    rows.push({
      id: "supplied",
      label: bil.symbol,
      amount: bilSupplied,
      usdValue: Big(bilSupplied).times(exchangeRate).toString(),
      netWorthUsd,
      netApyPercent: apyPercent,
      isRaw: false,
    })
  }
  if (hasRaw) {
    rows.push({
      id: "raw",
      label: t("bil.positions.uncollateralised", { label: bil.symbol }),
      amount: bilRaw,
      usdValue: Big(bilRaw).times(exchangeRate).toString(),
      netWorthUsd: Big(bilRaw).times(exchangeRate).toString(),
      netApyPercent: apyPercent,
      isRaw: true,
    })
  }

  if (!rows.length) return null

  return (
    <Paper>
      <Box p="l">
        <Text as="h2" font="primary" fs="base" fw={500}>
          {t("common:myPositions")}
        </Text>
      </Box>
      <Separator />
      <Flex direction="column" gap="m" p="m">
        {rows.map((row) => {
          const canWithdraw = Big(row.amount).gte(stats.minRedeem)

          return (
            <PositionCard
              key={row.id}
              logo={<AssetLogo id={bil.id} size="medium" hideChain />}
              symbol={row.label}
              stats={
                <>
                  <ValueStats
                    wrap
                    size="small"
                    font="secondary"
                    label={t("common:amount")}
                    customValue={
                      <Text fs="p3" fw={500} lh={1}>
                        {t("common:currency", {
                          value: row.amount,
                          symbol: bil.symbol,
                        })}
                      </Text>
                    }
                    bottomLabel={t("common:currency", {
                      value: row.usdValue,
                    })}
                  />
                  <ValueStats
                    wrap
                    size="small"
                    font="secondary"
                    label={t("borrow:netWorth")}
                    customValue={
                      <Text fs="p3" fw={500} lh={1}>
                        {t("common:currency", {
                          value: row.netWorthUsd,
                        })}
                      </Text>
                    }
                    bottomLabel={t("bil.positions.afterBorrow")}
                  />
                  <ValueStats
                    wrap
                    size="small"
                    font="secondary"
                    label={t("common:apy")}
                    customValue={
                      <Text fs="p3" fw={500} lh={1}>
                        {t("common:percent", {
                          value: row.netApyPercent,
                        })}
                      </Text>
                    }
                  />
                </>
              }
              cta={
                <>
                  {row.isRaw && (
                    <MicroButton
                      onClick={() => supplyRawMutation.mutate(bilRaw)}
                      disabled={supplyRawMutation.isPending}
                    >
                      {supplyRawMutation.isPending
                        ? t("bil.positions.action.depositing")
                        : t("common:deposit")}
                    </MicroButton>
                  )}
                  <Tooltip
                    text={
                      !canWithdraw
                        ? t("bil.withdraw.cta.belowMin", {
                            min: stats.minRedeem,
                            symbol: bil.symbol,
                          })
                        : undefined
                    }
                    asChild
                    side="top"
                  >
                    <Box as="span" sx={{ display: "inline-flex" }}>
                      <Button
                        variant="tertiary"
                        size="small"
                        disabled={!canWithdraw}
                        onClick={() => setWithdrawSource(row.id)}
                      >
                        {t("common:withdraw")}
                      </Button>
                    </Box>
                  </Tooltip>
                </>
              }
            />
          )
        })}
      </Flex>

      {withdrawSource && (
        <WithdrawModal
          open
          onClose={() => setWithdrawSource(null)}
          withdrawSource={withdrawSource}
        />
      )}
    </Paper>
  )
}
