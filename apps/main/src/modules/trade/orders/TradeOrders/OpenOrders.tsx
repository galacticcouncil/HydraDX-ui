import { DataTable, Modal } from "@galacticcouncil/ui/components"
import { FC, useMemo, useState } from "react"

import { PaginationProps } from "@/hooks/useDataTableUrlPagination"
import { DcaOrderDetailsModal } from "@/modules/trade/orders/DcaOrderDetailsModal"
import {
  DcaOrderData,
  isDcaScheduleOrder,
  OrderData,
  orderKey,
  OrderKind,
} from "@/modules/trade/orders/lib/orderData"
import { useIntentOrdersData } from "@/modules/trade/orders/lib/useIntentOrdersData"
import { useRemoveIntent } from "@/modules/trade/orders/lib/useRemoveIntent"
import { LimitOrderDetailsModal } from "@/modules/trade/orders/LimitOrderDetailsModal"
import { useOpenOrdersColumns } from "@/modules/trade/orders/OpenOrders/OpenOrders.columns"
import { OrdersEmptyState } from "@/modules/trade/orders/OrdersEmptyState"
import { TerminateDcaScheduleModalContent } from "@/modules/trade/orders/TerminateDcaScheduleModalContent"
import { useDcaEnrichment } from "@/modules/trade/orders/TradeOrders/lib/useDcaEnrichment"
import { PastExecutions } from "@/modules/trade/orders/TradeOrders/PastExecutions"
import { useNeckworkTradeQueriesEnabled } from "@/modules/trade/swap/tradeDataSource"

type Props = {
  readonly paginationProps: PaginationProps
  readonly orders: Array<OrderData>
  readonly isLoading: boolean
}

export const OpenOrders: FC<Props> = ({
  paginationProps,
  orders,
  isLoading: isOrdersLoading,
}) => {
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [terminating, setTerminating] = useState<DcaOrderData | null>(null)
  const removeIntent = useRemoveIntent()

  const neckworkEnabled = useNeckworkTradeQueriesEnabled()
  const { orders: intentOrders, isLoading: isIntentsLoading } =
    useIntentOrdersData()
  const scheduleOrders = useMemo(
    () => orders.filter(isDcaScheduleOrder),
    [orders],
  )
  const { orders: enrichedOrders, refetch } = useDcaEnrichment(scheduleOrders)

  const allOrders = useMemo<Array<OrderData>>(
    () => [...intentOrders, ...enrichedOrders],
    [intentOrders, enrichedOrders],
  )

  const columns = useOpenOrdersColumns()

  const detail = allOrders.find((order) => orderKey(order) === detailKey)

  const close = () => {
    setDetailKey(null)
    setTerminating(null)
  }

  const isLoading = isOrdersLoading || isIntentsLoading

  return (
    <>
      <DataTable
        data={allOrders}
        columns={columns}
        isLoading={isLoading}
        paginated
        {...paginationProps}
        onRowClick={(order) => {
          if (neckworkEnabled) void refetch()
          setDetailKey(orderKey(order))
        }}
        emptyState={<OrdersEmptyState />}
      />
      <Modal open={!!detail || !!terminating} onOpenChange={close}>
        {terminating ? (
          <TerminateDcaScheduleModalContent
            scheduleId={terminating.scheduleId}
            sold={terminating.fromAmountExecuted}
            total={terminating.fromAmountBudget}
            symbol={terminating.from.symbol}
            openBudget={terminating.isOpenBudget}
            onClose={() => setTerminating(null)}
          />
        ) : (
          detail &&
          (detail.kind === OrderKind.Limit ? (
            <LimitOrderDetailsModal details={detail} onCancel={close} />
          ) : (
            <DcaOrderDetailsModal
              details={detail}
              pastExecutions={
                isDcaScheduleOrder(detail) ? (
                  <PastExecutions scheduleId={detail.scheduleId} />
                ) : null
              }
              onTerminate={() => {
                if (isDcaScheduleOrder(detail)) {
                  setTerminating(detail)
                  return
                }

                removeIntent.mutate(detail.intentId, { onSuccess: close })
              }}
            />
          ))
        )}
      </Modal>
    </>
  )
}
