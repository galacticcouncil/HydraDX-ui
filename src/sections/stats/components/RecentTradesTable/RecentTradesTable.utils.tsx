import {
  SortingState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { isAfter } from "date-fns"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { theme } from "theme"
import {
  getChainSpecificAddress,
  shortenAccountAddress,
} from "utils/formatting"
import { TRecentTradesTableData } from "./data/RecentTradesTableData.utils"
import TradeIcon from "assets/icons/TradeTypeIcon.svg?react"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import LinkIcon from "assets/icons/LinkIcon.svg?react"
import { useAssets } from "providers/assets"

export const useRecentTradesTable = (data: TRecentTradesTableData) => {
  const { t } = useTranslation()
  const { getAssetWithFallback } = useAssets()

  const { accessor, display } =
    createColumnHelper<TRecentTradesTableData[number]>()
  const [sorting, setSorting] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    account: isDesktop,
    tradeValue: true,
    trade: true,
    date: isDesktop,
    actions: isDesktop,
  }

  const columnOrder = isDesktop
    ? ["account", "tradeValue", "trade", "date", "actions"]
    : ["trade", "tradeValue"]

  const columns = [
    accessor("account", {
      id: "account",
      header: t("stats.overview.table.trades.header.account"),
      sortingFn: (a, b) => a.original.account.localeCompare(b.original.account),
      cell: ({ row }) => (
        <Text fs={14} color="white">
          {row.original.isIdentity
            ? row.original.account
            : shortenAccountAddress(
                getChainSpecificAddress(row.original.account),
                6,
              )}
        </Text>
      ),
    }),

    accessor("tradeValue", {
      id: "tradeValue",
      header: isDesktop
        ? t("stats.overview.table.trades.header.tradeValue")
        : t("stats.overview.table.trades.header.tradeValueTime"),
      sortingFn: (a, b) =>
        a.original.tradeValue.gt(b.original.tradeValue) ? 1 : -1,
      cell: ({ row, getValue }) => {
        return isDesktop ? (
          <Text color="white" fs={14}>
            <DisplayValue value={getValue()} isUSD />
          </Text>
        ) : (
          <div sx={{ flex: "column", align: "flex-end", pr: 16 }}>
            <Text color="white" fs={14}>
              <DisplayValue value={getValue()} isUSD />
            </Text>
            <Text
              fs={11}
              color="darkBlue200"
              tAlign="right"
              css={{ whiteSpace: "nowrap" }}
            >
              {t("stats.overview.table.trades.value.totalValueTime", {
                date: new Date(row.original.date),
              })}
            </Text>
          </div>
        )
      },
    }),
    display({
      id: "trade",
      header: isDesktop ? "" : "asset",
      cell: ({ row }) => {
        const metaIn = getAssetWithFallback(row.original.assetInId)
        const iconInIds = metaIn.iconId

        const metaOut = getAssetWithFallback(row.original.assetOutId)
        const iconOutIds = metaOut.iconId

        return (
          <div sx={{ flex: "row", align: "center", gap: 6 }}>
            {isDesktop && (
              <Text fs={14}>
                {t("value.tokenWithSymbol", {
                  value: row.original.amountIn,
                  symbol: row.original.assetInSymbol,
                })}
              </Text>
            )}
            <MultipleAssetLogo size={18} iconId={iconInIds} />

            <Icon sx={{ color: "brightBlue600" }} icon={<TradeIcon />} />

            {isDesktop && (
              <Text fs={14}>
                {t("value.tokenWithSymbol", {
                  value: row.original.amountOut,
                  symbol: row.original.assetOutSymbol,
                })}
              </Text>
            )}
            <MultipleAssetLogo size={18} iconId={iconOutIds} />
          </div>
        )
      },
    }),
    accessor("date", {
      id: "date",
      header: t("stats.overview.table.trades.header.timeStamp"),
      sortingFn: (a, b) => (isAfter(a.original.date, b.original.date) ? 1 : -1),
      cell: ({ row }) => (
        <Text fs={14} color="white" css={{ whiteSpace: "nowrap" }}>
          {t("stats.overview.table.trades.value.totalValueTime", {
            date: new Date(row.original.date),
          })}
        </Text>
      ),
    }),
    display({
      id: "actions",
      cell: ({ row }) => (
        <div sx={{ pl: [5, 0] }}>
          <a
            href={`https://hydration.subscan.io/extrinsic/${row.original.extrinsicHash}`}
            target="blank"
            rel="noreferrer"
          >
            <Icon size={12} sx={{ color: "darkBlue300" }} icon={<LinkIcon />} />
          </a>
        </div>
      ),
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
