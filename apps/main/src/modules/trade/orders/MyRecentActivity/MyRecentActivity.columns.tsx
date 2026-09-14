import { ClassNames } from "@emotion/react"
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
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DcaOrderStatus } from "@/modules/trade/orders/columns/DcaOrderStatus"
import { SwapAmount } from "@/modules/trade/orders/columns/SwapAmount"
import { SwapMobile } from "@/modules/trade/orders/columns/SwapMobile"
import { SwapPrice } from "@/modules/trade/orders/columns/SwapPrice"
import {
  MarketDcaStatus,
  SwapStatus,
} from "@/modules/trade/orders/columns/SwapStatus"
import { SwapType } from "@/modules/trade/orders/columns/SwapType"
import { toOrderStatusFromSchedule } from "@/modules/trade/orders/lib/orderData"
import { OrderKind, RoutedTradeData } from "@/modules/trade/orders/lib/types"

const columnHelper = createColumnHelper<RoutedTradeData>()

export const useMyRecentActivityColumns = () => {
  const { t } = useTranslation(["common", "trade"])
  const { isMobile } = useBreakpoints()

  return useMemo(() => {
    const fromToColumn = columnHelper.display({
      header: t("trade:trade.orders.myActivity.fromTo"),
      cell: ({ row }) => {
        return (
          <SwapAmount
            fromAmount={row.original.fromAmount}
            from={row.original.from}
            toAmount={row.original.toAmount}
            to={row.original.to}
            showLogo
          />
        )
      },
    })

    const fillPriceColumn = columnHelper.display({
      id: "price",
      header: () => (
        <Flex gap="s" align="center">
          {t("trade:trade.orders.myActivity.fillPrice")}
          <Icon
            size="xs"
            component={ArrowRightLeft}
            color={getToken("textButtons.small.hover")}
          />
        </Flex>
      ),
      cell: ({ row }) => {
        return (
          <SwapPrice
            from={row.original.from}
            to={row.original.to}
            price={row.original.fillPrice}
          />
        )
      },
    })

    const typeColumn = columnHelper.display({
      header: t("trade:trade.orders.myActivity.type"),
      meta: {
        sx: { textAlign: "center" },
      },
      cell: ({ row }) => {
        const { status } = row.original

        return (
          status && (
            <Flex justify="center">
              <SwapType
                type={status.kind === "marketDca" ? OrderKind.Dca : status.kind}
              />
            </Flex>
          )
        )
      },
    })

    const statusColumn = columnHelper.display({
      header: t("trade:trade.orders.myActivity.status"),
      meta: {
        sx: { textAlign: "end" },
      },
      cell: ({ row }) => {
        const { status } = row.original

        if (!status) {
          return null
        }

        if (status.kind === "marketDca") {
          return <MarketDcaStatus />
        }

        return status.kind === OrderKind.Dca ||
          status.kind === OrderKind.DcaRolling ? (
          status.status && (
            <DcaOrderStatus
              status={toOrderStatusFromSchedule(status.status)}
              isDcaSwap
            />
          )
        ) : (
          <SwapStatus />
        )
      },
    })

    const actionColumn = columnHelper.display({
      id: "actions",
      size: 50,
      cell: ({ row }) => {
        if (!row.original.link) return null

        return (
          <Flex align="center" justify="end" gap="base">
            <Tooltip text={t("openInExplorer")} size="small" asChild side="top">
              <Button
                sx={{ p: "base" }}
                variant="muted"
                outline
                onClick={(e) => {
                  e.stopPropagation()
                }}
                asChild
              >
                <ExternalLink href={row.original.link}>
                  <Icon component={SquareArrowOutUpRight} size="s" />
                </ExternalLink>
              </Button>
            </Tooltip>
          </Flex>
        )
      },
    })

    const fromToColumnMobile = columnHelper.display({
      header: t("trade:trade.orders.fromTo.mobile"),
      cell: ({ row }) => {
        return (
          <ClassNames>
            {({ css }) => (
              <TableRowDetailsExpand
                containerClassName={css`
                  justify-content: space-between;
                `}
              >
                <SwapMobile from={row.original.from} to={row.original.to} />
              </TableRowDetailsExpand>
            )}
          </ClassNames>
        )
      },
    })

    if (isMobile) {
      return [fromToColumnMobile]
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
