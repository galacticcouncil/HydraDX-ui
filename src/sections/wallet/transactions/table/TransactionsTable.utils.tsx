import {
  SortingState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import BuyIcon from "assets/icons/BuyIcon.svg?react"
import ChevronRight from "assets/icons/ChevronRight.svg?react"
import LinkIcon from "assets/icons/LinkIcon.svg?react"
import SellIcon from "assets/icons/SellIcon.svg?react"
import TradeIcon from "assets/icons/TradeTypeIcon.svg?react"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Badge } from "components/Badge/Badge"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { AccountColumn } from "sections/wallet/transactions/table/columns/AccountColumn"
import { theme } from "theme"
import { createSubscanLink } from "utils/formatting"
import { TTransactionsTableData } from "./data/TransactionsTableData.utils"

export const useTransactionsTable = (data: TTransactionsTableData) => {
  const { t } = useTranslation()

  const { accessor, display } =
    createColumnHelper<TTransactionsTableData[number]>()
  const [sorting, setSorting] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    type: true,
    amount: true,
    badge: true,
    source: isDesktop,
    arrow: isDesktop,
    dest: isDesktop,
    actions: isDesktop,
  }

  const columnOrder = isDesktop
    ? ["type", "amount", "badge", "source", "arrow", "dest", "actions"]
    : ["type", "badge", "amount"]

  const columns = [
    accessor("type", {
      id: "type",
      header: t("wallet.transactions.table.header.type"),
      cell: ({ row }) => {
        const isDeposit = row.original.type === "deposit"
        return (
          <div sx={{ flex: "row", align: "center", gap: 8 }}>
            {isDeposit ? (
              <BuyIcon sx={{ color: "green500" }} width={18} height={18} />
            ) : (
              <SellIcon
                sx={{ color: "brightBlue300" }}
                width={18}
                height={18}
              />
            )}
            <div>
              <Text color="basic200" fs={14}>
                {isDeposit
                  ? t("wallet.transactions.table.type.deposit")
                  : t("wallet.transactions.table.type.withdraw")}
              </Text>
              <Text color="darkBlue200" fs={12} lh={14}>
                <span
                  title={t("stats.overview.table.trades.value.totalValueTime", {
                    date: row.original.date,
                  })}
                >
                  {t("stats.overview.chart.tvl.label.time", {
                    date: row.original.date,
                  })}
                </span>
              </Text>
            </div>
          </div>
        )
      },
    }),
    accessor("amount", {
      id: "amount",
      header: t("wallet.transactions.table.header.amount"),
      sortingFn: (a, b) => (a.original.amount.gt(b.original.amount) ? 1 : -1),
      cell: ({ row }) => {
        return (
          <div
            sx={{
              color: "white",
              flex: "row",
              gap: 8,
              align: "center",
              justify: ["end", "start"],
            }}
          >
            <MultipleAssetLogo size={16} iconId={row.original.assetIconIds} />

            <Text fs={14} css={{ whiteSpace: "nowrap" }}>
              {t("value.tokenWithSymbol", {
                value: row.original.amountDisplay,
                symbol: row.original.assetSymbol,
              })}
            </Text>
            <ChevronRight
              width={20}
              height={20}
              sx={{
                color: "darkBlue300",
                display: ["block", "none"],
                ml: -4,
                mr: 4,
              }}
            />
          </div>
        )
      },
    }),
    display({
      id: "badge",
      cell: ({ row }) => {
        return (
          row.original.isCrossChain && (
            <Badge variant="secondary" size="medium">
              {isDesktop
                ? t("wallet.transactions.table.crosschain")
                : t("wallet.transactions.table.xcm")}
            </Badge>
          )
        )
      },
    }),
    accessor("source", {
      id: "source",
      header: t("wallet.transactions.table.header.source"),
      cell: ({ row }) => (
        <AccountColumn
          address={row.original.source}
          addressDisplay={row.original.sourceDisplay}
          chain={row.original.sourceChain}
          isCrossChain={row.original.isCrossChain}
        />
      ),
    }),
    display({
      id: "arrow",
      cell: () => {
        return (
          <div sx={{ flex: "row", justify: "center" }}>
            <Icon
              size={14}
              sx={{ color: "darkBlue300" }}
              icon={<TradeIcon />}
            />
          </div>
        )
      },
    }),
    accessor("dest", {
      id: "dest",
      header: t("wallet.transactions.table.header.destination"),
      cell: ({ row }) => {
        return (
          <AccountColumn
            address={row.original.dest}
            addressDisplay={row.original.destDisplay}
            chain={row.original.destChain}
            isCrossChain={row.original.isCrossChain}
          />
        )
      },
    }),
    display({
      id: "actions",
      cell: ({ row }) => {
        const hash = row.original.extrinsicHash
        return (
          <a
            href={createSubscanLink("extrinsic", hash)}
            target="blank"
            rel="noreferrer"
          >
            <LinkIcon width={12} height={12} sx={{ color: "darkBlue300" }} />
          </a>
        )
      },
    }),
  ]

  return useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnOrder },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}
