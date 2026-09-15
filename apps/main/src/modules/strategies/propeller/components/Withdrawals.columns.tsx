import {
  Amount,
  Button,
  Chip,
  ChipProps,
  Flex,
  Text,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { getToken } from "@galacticcouncil/ui/utils"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"

export type WithdrawalRowState = "pending" | "partial" | "settled" | "claimed"

export interface WithdrawalRow {
  id: number
  amountShares: number
  /** Measured payout once settled; otherwise a carry-discounted estimate. */
  estEth: number
  isEstimate?: boolean
  state: WithdrawalRowState
  settledDate?: Date
  collateralOwed?: number
  collateralSettled?: number
  settledSoFar?: number
  /** Unwind stalled; remainder will be written off. */
  willSettleShort?: boolean
}

type WithdrawalStateLabel =
  | "pending"
  | "claimable"
  | "settling"
  | "settlingShort"
  | "claimed"

const stateChipVariant: Record<WithdrawalStateLabel, ChipProps["variant"]> = {
  pending: "orange",
  settling: "amber",
  settlingShort: "orange",
  claimable: "green",
  claimed: "blue",
}

const getWithdrawalStateLabel = (row: WithdrawalRow): WithdrawalStateLabel => {
  if (row.state === "claimed") return "claimed"

  const claimable = row.collateralSettled ?? 0
  if (claimable > 0) return "claimable"
  if (row.willSettleShort) return "settlingShort"
  if (row.state === "partial") return "settling"
  return "pending"
}

const columnHelper = createColumnHelper<WithdrawalRow>()

export type WithdrawalColumnHandlers = {
  onClaim: (requestId: number) => void
  isClaiming: boolean
}

export const useWithdrawalColumns = ({
  onClaim,
  isClaiming,
}: WithdrawalColumnHandlers) => {
  const { t } = useTranslation(["propeller", "common"])
  const { isMobile } = useBreakpoints()
  const { assetId, symbol, shareSymbol } = useActivePropellerVault()

  return useMemo(() => {
    const amountColumn = columnHelper.accessor("amountShares", {
      header: t("withdrawals.col.amount"),
      cell: ({ row }) => (
        <Flex align="center" gap="s">
          <AssetLogo id={assetId} size="small" />
          <Text fs="p4" fw={500} color={getToken("text.high")}>
            {t("common:currency", {
              value: row.original.amountShares,
              symbol: shareSymbol,
            })}
          </Text>
        </Flex>
      ),
    })

    const estValueColumn = columnHelper.accessor("estEth", {
      header: t("withdrawals.col.estValue"),
      meta: { sx: { textAlign: isMobile ? "right" : "left" } },
      cell: ({ row }) => (
        <Amount
          value={t("common:currency", {
            value: row.original.estEth,
            symbol,
          })}
          displayValue={t("common:currency", {
            value: row.original.estEth,
          })}
        />
      ),
    })

    const dateColumn = columnHelper.accessor("settledDate", {
      header: t("withdrawals.col.date"),
      cell: ({ row }) => (
        <Text fs="p4" color={getToken("text.medium")}>
          {row.original.settledDate
            ? t("common:date.datetime.short", {
                value: row.original.settledDate,
              })
            : "—"}
        </Text>
      ),
    })

    const stateColumn = columnHelper.display({
      id: "state",
      header: t("withdrawals.col.status"),
      meta: { sx: { textAlign: "right" } },
      cell: ({ row }) => {
        const r = row.original
        const label = getWithdrawalStateLabel(r)
        const owed = r.collateralOwed ?? 0
        const isPartial = r.state === "partial"

        return (
          <Flex direction="column" gap="s" align="flex-end">
            <Chip variant={stateChipVariant[label]} size="small">
              {t(`withdrawals.state.${label}`)}
            </Chip>
            {isPartial && owed > 0 && (
              <Text fs="p6" color={getToken("text.low")}>
                {t("withdrawals.settledProgress", {
                  settled: t("common:currency", {
                    value: r.settledSoFar ?? 0,
                  }),
                  owed: t("common:currency", { value: owed, symbol }),
                })}
              </Text>
            )}
          </Flex>
        )
      },
    })

    const actionsColumn = columnHelper.display({
      id: "actions",
      meta: { sx: { textAlign: "right" } },
      cell: ({ row }) => {
        const r = row.original
        const claimable = r.collateralSettled ?? 0
        if (claimable <= 0 || r.state === "claimed") return null
        return (
          <Flex justify="flex-end" align="center" gap="base">
            <Button
              variant="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onClaim(r.id)
              }}
              disabled={isClaiming}
            >
              {t("withdrawals.action.claim")}
            </Button>
          </Flex>
        )
      },
    })

    return [
      amountColumn,
      estValueColumn,
      dateColumn,
      stateColumn,
      actionsColumn,
    ]
  }, [t, isMobile, isClaiming, onClaim, assetId, symbol, shareSymbol])
}
