import { Paper, PaperProps, Separator } from "@galacticcouncil/ui/components"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { FC, useEffect } from "react"

import { useAccountIntents } from "@/api/intents"
import { useDataTableUrlPagination } from "@/hooks/useDataTableUrlPagination"
import { useInvalidateOrdersOnExecution } from "@/modules/trade/orders/lib/useInvalidateOrdersOnExecution"
import { OpenOrdersLegacy } from "@/modules/trade/orders/OpenOrdersLegacy"
import { OrderHistoryLegacy } from "@/modules/trade/orders/OrderHistoryLegacy"
import { useChainScheduleIds } from "@/modules/trade/orders/TradeOrders/lib/useChainOrdersData"
import {
  TradeOrdersHeader,
  TradeOrderTab,
} from "@/modules/trade/orders/TradeOrders/TradeOrdersHeader"

const TABS = [
  "openOrders",
  "orderHistory",
] as const satisfies ReadonlyArray<TradeOrderTab>

type Tab = (typeof TABS)[number]

export const TradeOrdersHistory: FC<PaperProps> = (props) => {
  const { tab } = useSearch({
    from: "/trade/_history",
  })
  const navigate = useNavigate()
  const { account } = useAccount()

  const paginationProps = useDataTableUrlPagination(
    "/trade/_history",
    "page",
    10,
  )

  const isSupportedTab = (TABS as ReadonlyArray<string>).includes(tab)
  const resolvedTab: Tab = isSupportedTab ? (tab as Tab) : "openOrders"

  const { scheduleIds } = useChainScheduleIds()
  const { data: intents } = useAccountIntents(account?.address ?? "")

  useInvalidateOrdersOnExecution()

  useEffect(() => {
    if (isSupportedTab) return

    void navigate({
      to: ".",
      search: (search) => ({
        ...search,
        tab: "openOrders",
      }),
      replace: true,
      resetScroll: false,
    })
  }, [isSupportedTab, navigate])

  return (
    <Paper sx={{ overflow: "hidden" }} {...props}>
      <TradeOrdersHeader
        tabs={TABS}
        paginationProps={paginationProps}
        openOrdersCount={scheduleIds.length + (intents?.length ?? 0)}
      />
      <Separator />
      <div sx={{ overflowX: "auto" }}>
        {resolvedTab === "openOrders" ? (
          <OpenOrdersLegacy paginationProps={paginationProps} />
        ) : (
          <OrderHistoryLegacy paginationProps={paginationProps} />
        )}
      </div>
    </Paper>
  )
}
