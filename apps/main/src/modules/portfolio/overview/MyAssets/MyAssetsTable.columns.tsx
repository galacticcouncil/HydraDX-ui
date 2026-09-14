import { LockOpen, StylizedAdd } from "@galacticcouncil/ui/assets/icons"
import {
  Amount,
  DataTableExpandTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  Icon,
  MenuItem,
  MenuItemIcon,
  MenuItemLabel,
  Modal,
  Skeleton,
  TableRowAction,
  TableRowDetailsExpand,
  Text,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { AnyChain } from "@galacticcouncil/xc-core"
import { Link } from "@tanstack/react-router"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { TAssetData } from "@/api/assets"
import { AssetLabelFull } from "@/components/AssetLabelFull"
import { LINKS, swapTabLink } from "@/config/navigation"
import { AssetDetailStaking } from "@/modules/portfolio/overview/MyAssets/AssetDetailStaking"
import { DepositToHydrationTableAction } from "@/modules/portfolio/overview/MyAssets/DepositToHydrationAction"
import { TransferPositionModal } from "@/modules/portfolio/overview/Transfer/TransferPositionModal"
import { useDisplayAssetStore } from "@/states/displayAsset"
import { NATIVE_ASSET_ID } from "@/utils/consts"
import { naturally, numericallyStr, sortBy } from "@/utils/sort"

export enum MyAssetsTableColumn {
  Asset = "asset",
  Total = "total",
  Transferable = "transferable",
  Staking = "staking",
  Actions = "actions",
}

export type MyAsset = TAssetData & {
  readonly origin: AnyChain | null
  readonly xcAssetKey?: string
  readonly canDeposit?: boolean
  readonly total: string
  readonly totalDisplay: string | undefined
  readonly transferable: string
  readonly transferableDisplay: string | undefined
  readonly canStake: boolean
}

const columnHelper = createColumnHelper<MyAsset>()

const COLUMN_WIDTHS = {
  asset: 320,
  total: 230,
  transferable: 230,
  actions: 300,
} as const

export type AssetDetailModal = "deposit" | "withdraw" | "transfer"

const AssetSkeletonCell = () => (
  <Flex align="center" gap="base">
    <Skeleton circle width="2rem" height="2rem" />
    <Flex direction="column" gap="xs">
      <Skeleton width="4rem" height="1rem" />
      <Skeleton width="7rem" height="0.875rem" />
    </Flex>
  </Flex>
)

const AmountSkeletonCell = () => (
  <Flex direction="column" gap="xs">
    <Skeleton width="6rem" height="1rem" />
    <Skeleton width="4rem" height="0.875rem" />
  </Flex>
)

const ActionsSkeletonCell = () => (
  <Flex justify="flex-end" gap="base">
    <Skeleton width="8.875rem" height="1.875rem" borderRadius="1rem" />
    <Skeleton width="4.625rem" height="1.875rem" borderRadius="1rem" />
    <Skeleton width="4.625rem" height="1.875rem" borderRadius="1rem" />
  </Flex>
)

const DepositActionSkeletonCell = () => (
  <Flex justify="flex-end">
    <Skeleton width="10.5rem" height="1.875rem" borderRadius="1rem" />
  </Flex>
)

export const useMyAssetsColumns = (
  isEmpty: boolean,
  isReadOnly = false,
  showDepositAction = true,
) => {
  const { t } = useTranslation(["wallet", "common"])
  const { isMobile, isLaptop, isTablet, isLargeDesktop } = useBreakpoints()

  const { isRealUSD, isStableCoin, symbol } = useDisplayAssetStore(
    useShallow(pick(["isRealUSD", "isStableCoin", "symbol"])),
  )
  const isDollar = isRealUSD || isStableCoin

  const formatDisplayValue = useCallback(
    (value: string | undefined) =>
      value === undefined
        ? "-"
        : t("common:currency", {
            value,
            ...(isDollar ? {} : { currency: symbol }),
          }),
    [t, isDollar, symbol],
  )

  const formatDisplayValueRef = useRef(formatDisplayValue)
  formatDisplayValueRef.current = formatDisplayValue

  return useMemo(() => {
    const assetColumn = columnHelper.accessor("symbol", {
      id: MyAssetsTableColumn.Asset,
      size: COLUMN_WIDTHS.asset,
      header: t("common:asset"),
      meta: {
        skeletonCell: AssetSkeletonCell,
      },
      sortingFn: sortBy({
        select: (row) => row.original.symbol,
        compare: naturally,
      }),
      cell: ({ row }) => {
        return <AssetLabelFull asset={row.original} />
      },
    })

    const totalColumn = columnHelper.accessor("totalDisplay", {
      id: MyAssetsTableColumn.Total,
      header: t("myAssets.header.total"),
      size: COLUMN_WIDTHS.total,
      sortUndefined: "last",
      meta: {
        skeletonCell: AmountSkeletonCell,
      },
      sortingFn: sortBy({
        select: (row) => row.original.totalDisplay ?? "",
        compare: numericallyStr,
      }),
      cell: ({ row }) => (
        <Amount
          value={t("common:number", {
            value: row.original.total,
          })}
          displayValue={formatDisplayValueRef.current(
            row.original.totalDisplay,
          )}
        />
      ),
    })

    const _transferableColumn = columnHelper.accessor("transferableDisplay", {
      id: MyAssetsTableColumn.Transferable,
      header: t("myAssets.header.transferable"),
      size: COLUMN_WIDTHS.transferable,
      sortUndefined: "last",
      meta: {
        skeletonCell: AmountSkeletonCell,
      },
      sortingFn: sortBy({
        select: (row) => row.original.transferableDisplay ?? "",
        compare: numericallyStr,
      }),
      cell: ({ row }) => (
        <Amount
          value={t("common:number", {
            value: row.original.transferable,
          })}
          displayValue={formatDisplayValueRef.current(
            row.original.transferableDisplay,
          )}
        />
      ),
    })

    const _actionsColumn = columnHelper.display({
      id: MyAssetsTableColumn.Actions,
      header: t("common:actions"),
      size: isLargeDesktop ? undefined : COLUMN_WIDTHS.actions,
      meta: {
        sx: {
          textAlign: "right",
          ...(isEmpty && { pr: "0 !important" }),
        },
        skeletonCell: isReadOnly
          ? DepositActionSkeletonCell
          : ActionsSkeletonCell,
      },
      cell: function Cell({ row }) {
        const [modal, setModal] = useState<AssetDetailModal | null>(null)

        if (isReadOnly) {
          return (
            <Flex align="center" justify="flex-end">
              <DepositToHydrationTableAction asset={row.original} />
            </Flex>
          )
        }

        return (
          <Flex
            gap={isLargeDesktop ? "base" : "s"}
            align="center"
            justify="flex-end"
          >
            {row.original.id === NATIVE_ASSET_ID && (
              <>
                {isLargeDesktop ? (
                  <AssetDetailStaking asset={row.original} />
                ) : null}
                <DataTableExpandTrigger>
                  <TableRowAction variant="accent">
                    <Icon component={LockOpen} size="xs" />
                    <Text display={["none", "block"]}>
                      {t("myAssets.locks")}
                    </Text>
                  </TableRowAction>
                </DataTableExpandTrigger>
              </>
            )}
            <TableRowAction onClick={() => setModal("transfer")}>
              {t("common:send")}
            </TableRowAction>
            <TableRowAction disabled={!row.original.isTradable} asChild>
              <Link
                {...swapTabLink("market")}
                search={{ assetIn: row.original.id }}
                disabled={!row.original.isTradable}
              >
                {t("common:trade")}
              </Link>
            </TableRowAction>
            {row.original.id === NATIVE_ASSET_ID && !isLargeDesktop && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TableRowAction
                    aria-label={t("common:more")}
                    sx={{ width: 30, minWidth: 30, px: 0 }}
                  >
                    <Icon component={MoreHorizontal} size="xs" />
                  </TableRowAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <MenuItem asChild>
                      <Link to={LINKS.stakingGigaStake}>
                        <MenuItemIcon component={StylizedAdd} />
                        <MenuItemLabel>
                          {t("myAssets.actions.staking", {
                            symbol: row.original.symbol,
                          })}
                        </MenuItemLabel>
                      </Link>
                    </MenuItem>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Modal
              variant="popup"
              open={modal !== null}
              onOpenChange={() => setModal(null)}
            >
              {modal === "transfer" && (
                <TransferPositionModal
                  assetId={row.original.id}
                  onClose={() => setModal(null)}
                />
              )}
            </Modal>
          </Flex>
        )
      },
    })

    const _transferableColumnPlaceholder = columnHelper.display({
      id: "spacer",
      header: "",
      size: COLUMN_WIDTHS.transferable,
      enableSorting: false,
      meta: {
        skeletonCell: () => null,
      },
      cell: () => null,
    })

    const _actionsColumnPlaceholder = columnHelper.display({
      id: "actions-spacer",
      header: "",
      size: isLargeDesktop ? undefined : COLUMN_WIDTHS.actions,
      enableSorting: false,
      meta: {
        sx: {
          textAlign: "right",
          ...(isEmpty && { pr: "0 !important" }),
        },
        skeletonCell: () => null,
      },
      cell: () => null,
    })

    const assetColumnMobile = columnHelper.accessor("symbol", {
      enableSorting: false,
      header: t("common:asset"),
      meta: {
        skeletonCell: AssetSkeletonCell,
      },
      cell: ({ row }) => {
        return <AssetLabelFull asset={row.original} withName={false} />
      },
    })

    const totalColumnMobile = columnHelper.accessor("totalDisplay", {
      id: MyAssetsTableColumn.Total,
      header: t("myAssets.header.total"),
      sortUndefined: "last",
      meta: {
        sx: {
          textAlign: "right",
        },
        skeletonCell: AmountSkeletonCell,
      },
      sortingFn: sortBy({
        select: (row) => row.original.totalDisplay ?? "",
        compare: numericallyStr,
      }),
      cell: ({ row }) => {
        const amount = (
          <Amount
            variant="default"
            value={t("common:number", {
              value: row.original.total,
            })}
            displayValue={formatDisplayValueRef.current(
              row.original.totalDisplay,
            )}
          />
        )

        return (
          <TableRowDetailsExpand>
            {!isReadOnly && row.original.id === NATIVE_ASSET_ID && (
              <TableRowAction variant="accent" allowPropagation>
                <Icon component={LockOpen} size="xs" />
                <Text display={["none", "block"]}>{t("myAssets.locks")}</Text>
              </TableRowAction>
            )}
            {amount}
          </TableRowDetailsExpand>
        )
      },
    })

    const transferableColumn = isReadOnly
      ? _transferableColumnPlaceholder
      : _transferableColumn

    const actionsColumn =
      isReadOnly && !showDepositAction
        ? _actionsColumnPlaceholder
        : _actionsColumn

    const useCompactColumns = isMobile || (isReadOnly && (isTablet || isLaptop))

    if (useCompactColumns) {
      return [assetColumnMobile, totalColumnMobile] as Array<ColumnDef<MyAsset>>
    }

    return [
      assetColumn,
      totalColumn,
      transferableColumn,
      actionsColumn,
    ] as Array<ColumnDef<MyAsset>>
  }, [
    t,
    isReadOnly,
    showDepositAction,
    isEmpty,
    isMobile,
    isTablet,
    isLaptop,
    isLargeDesktop,
  ])
}
