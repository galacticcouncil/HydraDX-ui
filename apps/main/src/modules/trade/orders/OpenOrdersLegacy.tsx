import { DataTable, Modal } from "@galacticcouncil/ui/components"
import { FC, useMemo, useState } from "react"

import { PaginationProps } from "@/hooks/useDataTableUrlPagination"
import { DcaOrderDetailsModal } from "@/modules/trade/orders/DcaOrderDetailsModal"
import {
  DcaOrderData,
  isDcaScheduleOrder,
  isIntentOrder,
  isMergedOrder,
  OrderData,
  orderKey,
  OrderKind,
} from "@/modules/trade/orders/lib/orderData"
import { useDcaGrafanaEnrichment } from "@/modules/trade/orders/lib/useDcaGrafanaEnrichment"
import { useIntentFillEnrichment } from "@/modules/trade/orders/lib/useIntentFillEnrichment"
import { useIntentOrdersData } from "@/modules/trade/orders/lib/useIntentOrdersData"
import { useMigratedOrdersMerge } from "@/modules/trade/orders/lib/useMigratedOrdersMerge"
import { useRemoveIntent } from "@/modules/trade/orders/lib/useRemoveIntent"
import { LimitOrderDetailsModal } from "@/modules/trade/orders/LimitOrderDetailsModal"
import { useOpenOrdersColumns } from "@/modules/trade/orders/OpenOrders/OpenOrders.columns"
import { OrdersEmptyState } from "@/modules/trade/orders/OrdersEmptyState"
import { PastExecutionsIntent } from "@/modules/trade/orders/PastExecutions/PastExecutionsIntent"
import { PastExecutionsLegacy } from "@/modules/trade/orders/PastExecutions/PastExecutionsLegacy"
import { PastExecutionsMerged } from "@/modules/trade/orders/PastExecutions/PastExecutionsMerged"
import { TerminateDcaScheduleModalContent } from "@/modules/trade/orders/TerminateDcaScheduleModalContent"
import { useChainOrdersData } from "@/modules/trade/orders/TradeOrders/lib/useChainOrdersData"

type Props = {
  readonly paginationProps: PaginationProps
}

export const OpenOrdersLegacy: FC<Props> = ({ paginationProps }) => {
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [terminating, setTerminating] = useState<DcaOrderData | null>(null)
  const removeIntent = useRemoveIntent()

  const { orders: chainOrders, isLoading: isChainLoading } =
    useChainOrdersData()
  const {
    orders: enrichedOrders,
    refetch,
    isFetching: isGrafanaFetching,
  } = useDcaGrafanaEnrichment(chainOrders)
  const { orders: chainIntentOrders, isLoading: isIntentsLoading } =
    useIntentOrdersData()
  const {
    orders: intentOrders,
    refetch: refetchIntents,
    isFetching: isIntentFillFetching,
  } = useIntentFillEnrichment(chainIntentOrders)

  const concatenated = useMemo<Array<OrderData>>(
    () => [...intentOrders, ...enrichedOrders],
    [intentOrders, enrichedOrders],
  )

  const { orders: allOrders } = useMigratedOrdersMerge(concatenated)

  const columns = useOpenOrdersColumns()

  const detail = allOrders.find((order) => orderKey(order) === detailKey)

  const detailAmountsLoading = useMemo(() => {
    if (!detail) {
      return { isSpentLoading: false, isReceivedLoading: false }
    }

    if (isMergedOrder(detail)) {
      const isFetching = isGrafanaFetching || isIntentFillFetching

      return {
        isSpentLoading:
          isFetching && detail.isOpenBudget && !detail.fromAmountExecuted,
        isReceivedLoading: isFetching && !detail.toAmountExecuted,
      }
    }

    if (isDcaScheduleOrder(detail)) {
      return {
        isSpentLoading:
          isGrafanaFetching &&
          detail.isOpenBudget &&
          !detail.fromAmountExecuted,
        isReceivedLoading: isGrafanaFetching && !detail.toAmountExecuted,
      }
    }

    return {
      isSpentLoading: isIntentFillFetching && !detail.fromAmountExecuted,
      isReceivedLoading: isIntentFillFetching && !detail.toAmountExecuted,
    }
  }, [detail, isGrafanaFetching, isIntentFillFetching])

  const close = () => {
    setDetailKey(null)
    setTerminating(null)
  }

  return (
    <>
      <DataTable
        data={allOrders}
        columns={columns}
        isLoading={isChainLoading || isIntentsLoading}
        paginated
        {...paginationProps}
        onRowClick={(order) => {
          if (!isGrafanaFetching) void refetch()
          if (!isIntentFillFetching) void refetchIntents()
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
            <LimitOrderDetailsModal
              details={detail}
              onCancel={close}
              isSpentLoading={detailAmountsLoading.isSpentLoading}
              isReceivedLoading={detailAmountsLoading.isReceivedLoading}
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
              isSpentLoading={detailAmountsLoading.isSpentLoading}
              isReceivedLoading={detailAmountsLoading.isReceivedLoading}
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
              onTerminate={() => {
                if (isIntentOrder(detail)) {
                  removeIntent.mutate(detail.intentId, { onSuccess: close })
                  return
                }

                setTerminating(detail)
              }}
            />
          ))
        )}
      </Modal>
    </>
  )
}
