import {
  Flex,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { TabItem, TabMenu } from "@/components/TabMenu"
import { TabMenuItem } from "@/components/TabMenu/TabMenuItem"
import { PaginationProps } from "@/hooks/useDataTableUrlPagination"
import { TradeHistorySearchParams } from "@/routes/trade/_history/route"

const PAIR_FILTER_ENABLED = false

export const tradeOrderTabs = [
  "myActivity",
  "openOrders",
  "orderHistory",
  "marketTransactions",
] as const

export type TradeOrderTab = (typeof tradeOrderTabs)[number]

const TAB_TITLE_KEYS = {
  myActivity: "trade.orders.myTrades",
  openOrders: "trade.orders.openOrders",
  orderHistory: "trade.orders.orderHistory",
  marketTransactions: "trade.orders.marketTransactions",
} as const satisfies Record<TradeOrderTab, string>

type PairFilter = "all" | "current"

type Props = {
  readonly tabs?: ReadonlyArray<TradeOrderTab>
  readonly paginationProps: PaginationProps
  readonly openOrdersCount: number
}

export const TradeOrdersHeader: FC<Props> = ({
  tabs = tradeOrderTabs,
  paginationProps,
  openOrdersCount,
}) => {
  const { t } = useTranslation("trade")
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { allPairs, assetIn, assetOut, destPlatform } = useSearch({
    from: "/trade/_history",
  })

  return (
    <Flex align="center" px="xl">
      <TabMenu
        gap="base"
        my="l"
        horizontalEdgeOffset="xl"
        items={tabs.map<TabItem>((tab) => ({
          to: pathname,
          title: t(TAB_TITLE_KEYS[tab]),
          search: {
            tab,
            allPairs,
            assetIn,
            assetOut,
            destPlatform,
          } satisfies TradeHistorySearchParams,
          resetScroll: false,
        }))}
        onClick={() => paginationProps.onPageClick(1)}
        renderItem={(item) => (
          <TabMenuItem
            size="small"
            item={item}
            variant="muted"
            badge={
              item.search?.tab === ("openOrders" satisfies TradeOrderTab) &&
              openOrdersCount > 0
                ? openOrdersCount
                : undefined
            }
          />
        )}
      />
      {PAIR_FILTER_ENABLED && (
        <Flex ml="auto" pl="xl" sx={{ flexShrink: 0 }}>
          <ToggleGroup<PairFilter>
            type="single"
            size="small"
            value={allPairs ? "all" : "current"}
            onValueChange={(value) => {
              if (!value) return

              navigate({
                to: ".",
                search: (search) => ({
                  ...search,
                  allPairs: value === "all",
                  page: 1,
                }),
                resetScroll: false,
              })
            }}
          >
            <ToggleGroupItem value="all">
              {t("trade.orders.allPairs.on")}
            </ToggleGroupItem>
            <ToggleGroupItem value="current">
              {t("trade.orders.allPairs.off")}
            </ToggleGroupItem>
          </ToggleGroup>
        </Flex>
      )}
    </Flex>
  )
}
