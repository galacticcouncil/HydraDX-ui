import { ChainErrorState } from "@/api/errors"
import { TransactionStatusVariant } from "@/components/TransactionItem/TransactionStatus.styled"
import { TAsset } from "@/providers/assetsProvider"

export enum DcaScheduleStatus {
  Created = "Created",
  Completed = "Completed",
  Terminated = "Terminated",
  Cancelled = "Cancelled",
}

export const DCA_OPEN_ORDER_STATUSES = [DcaScheduleStatus.Created] as const

export const DCA_HISTORY_ORDER_STATUSES = [
  DcaScheduleStatus.Completed,
  DcaScheduleStatus.Terminated,
  DcaScheduleStatus.Cancelled,
] as const

export const isDcaScheduleStatus = (
  status: unknown,
): status is DcaScheduleStatus =>
  Object.values(DcaScheduleStatus).includes(status as DcaScheduleStatus)

export enum OrderKind {
  Dca = "dca",
  DcaRolling = "dcaRolling",
  Limit = "limit",
}

export type OrderData = {
  readonly kind: OrderKind
  readonly scheduleId: number
  readonly from: TAsset
  readonly fromAmountBudget: string | null
  readonly fromAmountExecuted: string | null
  readonly fromAmountRemaining: string | null
  readonly singleTradeSize: string | null
  readonly to: TAsset
  readonly toAmountExecuted: string | null
  readonly status: DcaScheduleStatus | null
  readonly date: Date | null
  readonly blocksPeriod: string | null
  readonly isOpenBudget: boolean
}

export type MarketSwapStatus = {
  readonly kind: "market"
  readonly status: "filled"
}

export type MyActivityDcaOrderStatus = {
  readonly kind: OrderKind.Dca | OrderKind.DcaRolling
  readonly status: DcaScheduleStatus | null
  readonly scheduleId: number
  readonly sold: string
  readonly total: string
  readonly symbol: string
}

export type MarketDcaOrderStatus = {
  readonly kind: "marketDca"
  readonly scheduleId: number
}

export type OrderStatus =
  | MarketSwapStatus
  | MyActivityDcaOrderStatus
  | MarketDcaOrderStatus

export type SwapData = {
  readonly from: TAsset
  readonly fromAmount: string
  readonly to: TAsset
  readonly toAmount: string
  readonly fillPrice: string
  readonly link: string | null
  readonly address: string | null
  readonly date: Date | null
  readonly status: OrderStatus | null
}

export type RoutedTradeData = {
  readonly from: TAsset
  readonly fromAmount: string
  readonly to: TAsset
  readonly toAmount: string
  readonly fillPrice: string
  readonly date: Date
  readonly link: string | null
  readonly status: OrderStatus | null
}

export type PastExecutionData = {
  readonly id: string
  readonly status: TransactionStatusVariant
  readonly amountIn: string
  readonly amountOut: string
  readonly timestamp: Date | null
  readonly link: string | null
  readonly errorState: ChainErrorState | null
}
