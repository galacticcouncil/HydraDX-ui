import { ChevronRight } from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  Chip,
  ChipVariant,
  Flex,
  Icon,
  Modal,
  Skeleton,
  Text,
  Tooltip,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { getToken } from "@galacticcouncil/ui/utils"
import { Link } from "@tanstack/react-router"
import { createColumnHelper } from "@tanstack/table-core"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AssetLabelUniV3 } from "@/components/AssetLabelFull/AssetLabelFull"
import { NoData } from "@/components/NoData/NoData"
import { AddVaultLiquidity } from "@/modules/liquidity/components/AddVaultLiquidity/AddVaultLiquidity"
import { VaultStatus, VaultTable } from "@/modules/liquidity/Vaults.utils"
import { numericallyStr, sortBy } from "@/utils/sort"

const columnHelper = createColumnHelper<VaultTable>()

export const getVaultsColumnsVisibility = (isMobile: boolean) => ({
  vaultTvlDisplay: !isMobile,
  volumeDisplay: true,
  apr: !isMobile,
  price: !isMobile,
  status: !isMobile,
  actions: !isMobile,
})

const STATUS_VARIANT: Record<VaultStatus, ChipVariant> = {
  empty: "blue",
  inRange: "green",
  outOfRange: "amber",
  depositsClosed: "amber",
  notStarted: "tertiary",
  noVault: "blue",
}

const VaultActions = ({ vault }: { vault: VaultTable }) => {
  const { t } = useTranslation(["liquidity", "common"])
  const [open, setOpen] = useState(false)

  return (
    <Flex
      gap="s"
      justify="end"
      onClick={(e) => e.stopPropagation()}
      position="relative"
    >
      <Button
        variant="accent"
        outline
        disabled={!vault.canDeposit}
        onClick={() => setOpen(true)}
      >
        {t("liquidity:joinPool")}
      </Button>

      <Button variant="tertiary" outline asChild>
        <Link to="/liquidity/vault/$address" params={{ address: vault.id }}>
          {vault.positionShares > 0n ? t("common:manage") : t("common:details")}
        </Link>
      </Button>

      <Modal variant="popup" open={open} onOpenChange={setOpen}>
        {open && (
          <AddVaultLiquidity
            vault={vault}
            closable
            onSubmitted={() => setOpen(false)}
          />
        )}
      </Modal>

      {vault.positionShares > 0n && (
        <Text
          color={getToken("text.tint.secondary")}
          fw={500}
          fs="p6"
          position="absolute"
          bottom="-xl"
        >
          {t("liquidity:liquidity.pool.positions.total", {
            value: vault.positionValueDisplay ?? 0,
          })}
        </Text>
      )}
    </Flex>
  )
}

export const useVaultsColumns = () => {
  const { t } = useTranslation(["common", "liquidity"])
  const { isMobile } = useBreakpoints()

  return useMemo(
    () => [
      columnHelper.accessor("id", {
        id: "vault",
        size: 300,
        header: t("liquidity:vaults.column.vault"),
        cell: ({ row: { original } }) => (
          <AssetLabelUniV3
            iconIds={original.tokens.map((token) => token.id)}
            symbol={original.tokens.map((token) => token.symbol).join(" / ")}
          />
        ),
      }),
      columnHelper.accessor("price", {
        header: t("liquidity:vaults.column.price"),
        meta: { sx: { textAlign: isMobile ? "right" : "left" } },
        cell: ({ row: { original } }) => {
          const [token0, token1] = original.tokens

          return (
            <Text whiteSpace="nowrap">
              {t("liquidity:vaults.price.pair", {
                value: original.price ?? 0,
                symbolA: token0.symbol,
                symbolB: token1.symbol,
              })}
            </Text>
          )
        },
      }),
      columnHelper.accessor("volumeDisplay", {
        header: t("liquidity:24hVolume"),
        meta: { sx: { textAlign: isMobile ? "right" : "left" } },
        cell: ({ row: { original } }) => {
          const volume =
            original.volumeDisplay !== undefined ? (
              t("currency", { value: Number(original.volumeDisplay) })
            ) : (
              <NoData />
            )

          return original.isVolumeLoading ? (
            <Skeleton width={60} height="1em" />
          ) : isMobile ? (
            <Flex align="center" gap="s" justify="flex-end">
              {volume}
              <Icon
                component={ChevronRight}
                size="m"
                color={getToken("text.low")}
              />
            </Flex>
          ) : (
            volume
          )
        },
        sortingFn: sortBy({
          select: (row) => row.original.volumeDisplay ?? "0",
          compare: numericallyStr,
        }),
      }),
      columnHelper.accessor("vaultTvlDisplay", {
        header: t("liquidity:totalValueLocked"),
        meta: { sx: { textAlign: isMobile ? "right" : "left" } },
        cell: ({ row: { original } }) =>
          original.vault ? (
            t("currency", { value: Number(original.vaultTvlDisplay ?? 0) })
          ) : (
            <NoData />
          ),
        sortingFn: sortBy({
          select: (row) => row.original.vaultTvlDisplay ?? "0",
          compare: numericallyStr,
        }),
      }),
      columnHelper.accessor("apr", {
        header: t("liquidity:vaults.column.apr"),
        meta: { sx: { textAlign: isMobile ? "right" : "left" } },
        cell: ({ row: { original } }) =>
          original.isVolumeLoading ? (
            <Skeleton width={50} height="1em" />
          ) : original.apr !== undefined ? (
            <Tooltip text={t("liquidity:vaults.column.apr.tooltip")}>
              <Text>{t("percent", { value: original.apr })}</Text>
            </Tooltip>
          ) : (
            <NoData />
          ),
        sortingFn: sortBy({
          select: (row) => row.original.apr ?? "0",
          compare: numericallyStr,
        }),
      }),
      columnHelper.display({
        id: "status",
        header: t("liquidity:vaults.column.status"),
        meta: { sx: { textAlign: isMobile ? "right" : "left" } },
        cell: ({ row: { original } }) => (
          <Tooltip
            text={t(`liquidity:vaults.status.${original.status}.tooltip`)}
          >
            <Chip
              variant={STATUS_VARIANT[original.status]}
              size="small"
              rounded
            >
              {t(`liquidity:vaults.status.${original.status}`)}
            </Chip>
          </Tooltip>
        ),
      }),
      columnHelper.display({
        id: "actions",
        meta: { sx: { textAlign: "right" } },
        cell: ({ row: { original } }) => <VaultActions vault={original} />,
      }),
    ],
    [t, isMobile],
  )
}
