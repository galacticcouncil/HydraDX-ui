import {
  ArrowRightLeft,
  SquareArrowOutUpRight,
} from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  ExternalLink,
  Flex,
  Icon,
  TableRowDetailsExpand,
  Tooltip,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { getToken } from "@galacticcouncil/ui/utils"
import { neckwork } from "@galacticcouncil/utils"
import { createColumnHelper } from "@tanstack/react-table"
import Big from "big.js"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DateText } from "@/components/RelativeDateText"
import { AmountMobile } from "@/modules/trade/orders/columns/AmountMobile"
import { DcaOrderStatus } from "@/modules/trade/orders/columns/DcaOrderStatus"
import { SwapAmount } from "@/modules/trade/orders/columns/SwapAmount"
import { SwapMobile } from "@/modules/trade/orders/columns/SwapMobile"
import { SwapPrice } from "@/modules/trade/orders/columns/SwapPrice"
import { SwapType } from "@/modules/trade/orders/columns/SwapType"
import {
  isDcaScheduleOrder,
  isIntentOrder,
  OrderData,
} from "@/modules/trade/orders/lib/orderData"

const columnHelper = createColumnHelper<OrderData>()

export const useOrderHistoryColumns = () => {
  const { t } = useTranslation(["common", "trade"])
  const { isMobile } = useBreakpoints()

  return useMemo(() => {
    const fromToColumn = columnHelper.display({
      header: t("trade:trade.orders.orderHistory.inOut"),
      cell: ({ row }) => {
        const { from, to, fromAmountExecuted, toAmountExecuted } = row.original

        return (
          <SwapAmount
            fromAmount={fromAmountExecuted}
            from={from}
            toAmount={toAmountExecuted}
            to={to}
            showLogo
          />
        )
      },
    })

    const fillPriceColumn = columnHelper.display({
      id: "price",
      header: () => (
        <Flex gap="s" align="center">
          {t("trade:trade.orders.orderHistory.averagePrice")}
          <Icon
            size="xs"
            component={ArrowRightLeft}
            color={getToken("textButtons.small.hover")}
          />
        </Flex>
      ),
      cell: ({ row }) => {
        const { from, to, fromAmountExecuted, toAmountExecuted } = row.original

        const price =
          toAmountExecuted && fromAmountExecuted && Big(toAmountExecuted).gt(0)
            ? Big(fromAmountExecuted).div(toAmountExecuted).toString()
            : null

        return <SwapPrice from={from} to={to} price={price} />
      },
    })

    const typeColumn = columnHelper.display({
      header: t("trade:trade.orders.orderHistory.type"),
      meta: {
        sx: { textAlign: "center" },
      },
      cell: ({ row }) => {
        return (
          <Flex justify="center">
            <SwapType
              type={row.original.kind}
              isLimit={
                "limitPrice" in row.original && !!row.original.limitPrice
              }
            />
          </Flex>
        )
      },
    })

    const statusColumn = columnHelper.display({
      header: t("trade:trade.orders.orderHistory.status"),
      meta: {
        sx: { textAlign: "end" },
      },
      cell: ({ row }) =>
        row.original.status && (
          <Flex direction="column" gap="xs">
            <DcaOrderStatus status={row.original.status} />
            {row.original.timestamp && (
              <DateText
                date={new Date(row.original.timestamp)}
                fw={500}
                fs="p6"
                color={getToken("text.medium")}
              />
            )}
          </Flex>
        ),
    })

    const actionColumn = columnHelper.display({
      id: "actions",
      size: 50,
      cell: ({ row }) => {
        const order = row.original

        const href = isDcaScheduleOrder(order)
          ? neckwork.activityDca(order.scheduleId)
          : isIntentOrder(order) && order.resolvedBlock !== null
            ? neckwork.block(order.resolvedBlock)
            : null

        return (
          href && (
            <Flex align="center" justify="end" gap="base">
              <Tooltip
                text={t("openInExplorer")}
                size="small"
                asChild
                side="top"
              >
                <Button
                  sx={{ p: "base" }}
                  variant="muted"
                  outline
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  asChild
                >
                  <ExternalLink href={href}>
                    <Icon component={SquareArrowOutUpRight} size="s" />
                  </ExternalLink>
                </Button>
              </Tooltip>
            </Flex>
          )
        )
      },
    })

    const fromToColumnMobile = columnHelper.display({
      header: t("trade:trade.orders.fromTo.mobile"),
      cell: ({ row }) => {
        return <SwapMobile from={row.original.from} to={row.original.to} />
      },
    })

    const statusColumnMobile = columnHelper.display({
      header: t("trade:trade.orders.status.mobile"),
      meta: {
        sx: { textAlign: "end" },
      },
      cell: ({ row }) => (
        <TableRowDetailsExpand>
          <AmountMobile
            fromAmount={row.original.fromAmountExecuted}
            from={row.original.from}
            status={row.original.status}
          />
        </TableRowDetailsExpand>
      ),
    })

    if (isMobile) {
      return [fromToColumnMobile, statusColumnMobile]
    }

    return [
      fromToColumn,
      fillPriceColumn,
      typeColumn,
      statusColumn,
      actionColumn,
    ]
  }, [t, isMobile])
}
