import { DataTable, Modal } from "@galacticcouncil/ui/components"
import { FC, useMemo, useState } from "react"

import { PaginationProps } from "@/hooks/useDataTableUrlPagination"
import { DcaOrderDetailsModal } from "@/modules/trade/orders/DcaOrderDetailsModal"
import { sortOrdersByCreation } from "@/modules/trade/orders/lib/buildOrderRows"
import {
  isDcaScheduleOrder,
  isIntentOrder,
  isMergedOrder,
  OrderData,
  orderKey,
  OrderKind,
} from "@/modules/trade/orders/lib/orderData"
import { useIntentOrdersHistoryData } from "@/modules/trade/orders/lib/useIntentOrdersHistoryData"
import { useMigratedOrdersMerge } from "@/modules/trade/orders/lib/useMigratedOrdersMerge"
import { useTradeOrdersHistoryData } from "@/modules/trade/orders/lib/useTradeOrdersHistoryData"
import { LimitOrderDetailsModal } from "@/modules/trade/orders/LimitOrderDetailsModal"
import { useOrderHistoryColumns } from "@/modules/trade/orders/OrderHistory/OrderHistory.columns"
import { OrdersEmptyState } from "@/modules/trade/orders/OrdersEmptyState"
import { PastExecutionsIntent } from "@/modules/trade/orders/PastExecutions/PastExecutionsIntent"
import { PastExecutionsLegacy } from "@/modules/trade/orders/PastExecutions/PastExecutionsLegacy"
import { PastExecutionsMerged } from "@/modules/trade/orders/PastExecutions/PastExecutionsMerged"

type Props = {
  readonly paginationProps: PaginationProps
}

export const OrderHistoryLegacy: FC<Props> = ({ paginationProps }) => {
  const [detailKey, setDetailKey] = useState<string | null>(null)

  const { orders: scheduleOrders, isLoading: isSchedulesLoading } =
    useTradeOrdersHistoryData()
  const { orders: intentOrders, isLoading: isIntentsLoading } =
    useIntentOrdersHistoryData()

  const concatenated = useMemo<Array<OrderData>>(
    () => [...intentOrders, ...scheduleOrders],
    [intentOrders, scheduleOrders],
  )

  const { orders: merged } = useMigratedOrdersMerge(concatenated)

  const orders = useMemo(() => sortOrdersByCreation(merged), [merged])

  const columns = useOrderHistoryColumns()

  const detail = orders.find((order) => orderKey(order) === detailKey)

  const close = () => setDetailKey(null)

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        isLoading={isSchedulesLoading || isIntentsLoading}
        paginated
        {...paginationProps}
        onRowClick={(order) => setDetailKey(orderKey(order))}
        emptyState={<OrdersEmptyState />}
      />
      <Modal open={!!detail} onOpenChange={close}>
        {detail &&
          (detail.kind === OrderKind.Limit ? (
            <LimitOrderDetailsModal
              details={detail}
              onCancel={close}
              pastExecutions={
                detail.isPartiallyFillable ? (
                  <PastExecutionsIntent
                    intentId={detail.intentId}
                    assetIn={detail.from}
                    assetOut={detail.to}
                  />
                ) : null
              }
            />
          ) : (
            <DcaOrderDetailsModal
              details={detail}
              onTerminate={null}
              pastExecutions={
                isMergedOrder(detail) ? (
                  <PastExecutionsMerged
                    scheduleId={detail.scheduleId}
                    intentId={detail.intentId}
                    assetIn={detail.from}
                    assetOut={detail.to}
                  />
                ) : isDcaScheduleOrder(detail) ? (
                  <PastExecutionsLegacy
                    scheduleId={detail.scheduleId}
                    assetIn={detail.from}
                    assetOut={detail.to}
                  />
                ) : isIntentOrder(detail) ? (
                  <PastExecutionsIntent
                    intentId={detail.intentId}
                    assetIn={detail.from}
                    assetOut={detail.to}
                  />
                ) : null
              }
            />
          ))}
      </Modal>
    </>
  )
}
