import { DataTable, Modal } from "@galacticcouncil/ui/components"
import { FC, useState } from "react"

import { PaginationProps } from "@/hooks/useDataTableUrlPagination"
import { DcaOrderDetailsModal } from "@/modules/trade/orders/DcaOrderDetailsModal"
import {
  DcaOrderData,
  isDcaScheduleOrder,
  OrderData,
} from "@/modules/trade/orders/lib/orderData"
import { DCA_HISTORY_ORDER_STATUSES } from "@/modules/trade/orders/lib/types"
import { useOrderHistoryColumns } from "@/modules/trade/orders/OrderHistory/OrderHistory.columns"
import { OrdersEmptyState } from "@/modules/trade/orders/OrdersEmptyState"
import { useHistoryData } from "@/modules/trade/orders/TradeOrders/lib/useHistoryData"
import { PastExecutions } from "@/modules/trade/orders/TradeOrders/PastExecutions"

type Props = {
  readonly paginationProps: PaginationProps
  readonly assetIds: Array<string>
}

export const OrderHistory: FC<Props> = ({ paginationProps, assetIds }) => {
  const [isDetailOpen, setIsDetailOpen] = useState<DcaOrderData | null>(null)

  const { orders, totalCount, isLoading } = useHistoryData(
    DCA_HISTORY_ORDER_STATUSES,
    assetIds,
    paginationProps.pagination.pageIndex,
    paginationProps.pagination.pageSize,
  )

  const columns = useOrderHistoryColumns()

  return (
    <>
      <DataTable<OrderData>
        data={orders}
        columns={columns}
        isLoading={isLoading}
        paginated
        {...paginationProps}
        rowCount={totalCount}
        onRowClick={(order) =>
          isDcaScheduleOrder(order) && setIsDetailOpen(order)
        }
        emptyState={<OrdersEmptyState />}
      />
      <Modal open={!!isDetailOpen} onOpenChange={() => setIsDetailOpen(null)}>
        {isDetailOpen && (
          <DcaOrderDetailsModal
            details={isDetailOpen}
            onTerminate={null}
            pastExecutions={
              <PastExecutions scheduleId={isDetailOpen.scheduleId} />
            }
          />
        )}
      </Modal>
    </>
  )
}
