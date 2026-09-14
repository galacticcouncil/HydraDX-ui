import { DcaScheduleStatus, OrderKind } from "@/modules/trade/orders/lib/types"
import type { TAsset } from "@/providers/assetsProvider"

export { OrderKind }

export enum OrderStatus {
  Created = "Created",
  Completed = "Completed",
  Terminated = "Terminated",
  Cancelled = "Cancelled",
  Expired = "Expired",
  MigrationCancelled = "MigrationCancelled",
}

export const DCA_OPEN_ORDER_STATUSES = [OrderStatus.Created] as const

export const DCA_HISTORY_ORDER_STATUSES = [
  OrderStatus.Completed,
  OrderStatus.Terminated,
  OrderStatus.Cancelled,
] as const

export const isOrderStatus = (status: unknown): status is OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus)

export const toOrderStatusFromSchedule = (
  status: DcaScheduleStatus,
): OrderStatus =>
  ({
    [DcaScheduleStatus.Created]: OrderStatus.Created,
    [DcaScheduleStatus.Completed]: OrderStatus.Completed,
    [DcaScheduleStatus.Terminated]: OrderStatus.Terminated,
    [DcaScheduleStatus.Cancelled]: OrderStatus.Cancelled,
  })[status]

const INTENT_TERMINAL_STATUS_MAP: Record<string, OrderStatus> = {
  "Intent.IntentResolved": OrderStatus.Completed,
  "Intent.DcaCompleted": OrderStatus.Completed,
  "Intent.IntentCanceled": OrderStatus.Cancelled,
  "Intent.IntentExpired": OrderStatus.Expired,
}

export const toIntentOrderStatus = (eventName: string): OrderStatus | null =>
  INTENT_TERMINAL_STATUS_MAP[eventName] ?? null

export type OrderDataBase = {
  readonly from: TAsset
  readonly to: TAsset
  readonly fromAmountBudget: string | null
  readonly fromAmountExecuted: string | null
  readonly fromAmountRemaining: string | null
  readonly toAmountExecuted: string | null
  readonly timestamp: number | null
  readonly status: OrderStatus | null
}

export type IntentOrderDataBase = {
  readonly resolvedBlock: number | null
}

export type IntentLimitOrderData = OrderDataBase &
  IntentOrderDataBase & {
    readonly kind: OrderKind.Limit
    readonly intentId: bigint
    readonly toAmountBudget: string | null
    readonly deadline: number | null
    readonly isPartiallyFillable: boolean
  }

export type DcaOrderDataBase = OrderDataBase & {
  readonly kind: OrderKind.Dca | OrderKind.DcaRolling
  readonly singleTradeSize: string | null
  readonly blocksPeriod: string | null
  readonly isOpenBudget: boolean
  readonly limitPrice: string | null
}

export type DcaOrderData = DcaOrderDataBase & {
  readonly scheduleId: number
}

export type IntentDcaOrderData = DcaOrderDataBase &
  IntentOrderDataBase & {
    readonly intentId: bigint
  }

export type MergedOrderData = DcaOrderDataBase & {
  readonly scheduleId: number
  readonly intentId: bigint
}

export type OrderData =
  | IntentLimitOrderData
  | DcaOrderData
  | IntentDcaOrderData
  | MergedOrderData

export const isMergedOrder = (order: OrderData): order is MergedOrderData =>
  "scheduleId" in order && "intentId" in order

export const isIntentOrder = (
  order: OrderData,
): order is IntentLimitOrderData | IntentDcaOrderData => "intentId" in order

export const isDcaScheduleOrder = (order: OrderData): order is DcaOrderData =>
  "scheduleId" in order

export const orderKey = (order: OrderData): string =>
  isMergedOrder(order)
    ? `migrated:${order.scheduleId}`
    : isDcaScheduleOrder(order)
      ? `schedule:${order.scheduleId}`
      : `intent:${order.intentId}`
