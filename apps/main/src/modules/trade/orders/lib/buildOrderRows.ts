import { findNested } from "@galacticcouncil/utils"
import Big from "big.js"
import { isNonNullish } from "remeda"

import type { AccountIntentEntry } from "@/api/intents"
import {
  type DcaOrderData,
  type IntentDcaOrderData,
  type IntentLimitOrderData,
  isDcaScheduleOrder,
  isIntentOrder,
  isMergedOrder,
  type MergedOrderData,
  type OrderData,
  OrderKind,
  OrderStatus,
  toIntentOrderStatus,
} from "@/modules/trade/orders/lib/orderData"
import type { AssetId, TAsset } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

export type GetAsset = (id: AssetId) => TAsset

export type IndexerOrderEvent = {
  readonly name: string
  readonly args?: unknown
  readonly call?: { readonly args?: unknown } | null
  readonly block?: {
    readonly height?: number
    readonly timestamp?: string
  } | null
}

type ScheduledEventArgs = {
  id: number
}

type ScheduledOrderArgs = {
  assetIn: number
  assetOut: number
  amountIn?: string
  maxAmountIn?: string
}

type ScheduleArgs = {
  order: ScheduledOrderArgs
  period: number
  totalAmount: string
}

type ScheduledCallArgs = {
  schedule?: ScheduleArgs
}

type StatusEventArgs = {
  id: number
  error?: string
}

export const intentEntryToOrder = (
  entry: AccountIntentEntry,
  getAsset: GetAsset,
): OrderData | null => {
  const { data } = entry.intent

  if (data.type === "Swap") {
    const swap = data.value
    const from = getAsset(String(swap.asset_in))
    const to = getAsset(String(swap.asset_out))
    const isPartiallyFillable = swap.partial.type === "Yes"
    const fromAmountExecuted =
      swap.partial.type === "Yes"
        ? scaleHuman(swap.partial.value, from.decimals)
        : null
    const fromAmountBudget = scaleHuman(swap.amount_in, from.decimals)
    const fromAmountRemaining =
      fromAmountExecuted !== null
        ? Big(fromAmountBudget).minus(fromAmountExecuted).toString()
        : fromAmountBudget

    return {
      kind: OrderKind.Limit,
      intentId: entry.id,
      from,
      fromAmountBudget,
      fromAmountExecuted,
      fromAmountRemaining,
      to,
      toAmountBudget: scaleHuman(swap.amount_out, to.decimals),
      toAmountExecuted: null,
      status: OrderStatus.Created,
      deadline: entry.intent.deadline ? Number(entry.intent.deadline) : null,
      timestamp: Number(entry.id >> 64n),
      isPartiallyFillable,
      resolvedBlock: null,
    } satisfies IntentLimitOrderData
  }

  if (data.type === "Dca") {
    const dca = data.value
    const from = getAsset(String(dca.asset_in))
    const to = getAsset(String(dca.asset_out))
    const isOpenBudget = dca.budget === undefined || dca.budget === 0n
    const budget = dca.budget ?? 0n
    const fromAmountBudget = isOpenBudget
      ? null
      : scaleHuman(budget, from.decimals)
    const fromAmountRemaining = isOpenBudget
      ? null
      : scaleHuman(dca.remaining_budget, from.decimals)
    const fromAmountExecuted = isOpenBudget
      ? null
      : scaleHuman(budget - dca.remaining_budget, from.decimals)
    const amountIn = scaleHuman(dca.amount_in, from.decimals)
    const amountOut = scaleHuman(dca.amount_out, to.decimals)

    const isLimit =
      !!to.existentialDeposit &&
      Big(dca.amount_out.toString()).gt(to.existentialDeposit)
    const limitPrice =
      isLimit && Big(amountOut).gt(0)
        ? Big(amountIn).div(amountOut).toString()
        : null

    return {
      kind: isOpenBudget ? OrderKind.DcaRolling : OrderKind.Dca,
      intentId: entry.id,
      from,
      fromAmountBudget,
      fromAmountExecuted,
      fromAmountRemaining,
      to,
      toAmountExecuted: null,
      status: OrderStatus.Created,
      timestamp: Number(entry.id >> 64n),
      singleTradeSize: amountIn,
      blocksPeriod: String(dca.period),
      isOpenBudget,
      limitPrice,
      resolvedBlock: null,
    } satisfies IntentDcaOrderData
  }

  return null
}

export const buildIntentOrderRows = (
  intents: ReadonlyArray<AccountIntentEntry>,
  getAsset: GetAsset,
): Array<OrderData> =>
  intents
    .map((entry) => intentEntryToOrder(entry, getAsset))
    .filter(isNonNullish)

const blockTimestamp = (event: IndexerOrderEvent): number | null => {
  const raw = event.block?.timestamp
  if (!raw) return null

  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

const scheduleEventToOrder = (
  event: IndexerOrderEvent,
  status: OrderStatus | null,
  getAsset: GetAsset,
): DcaOrderData | null => {
  const args = event.args as ScheduledEventArgs | null
  const callArgs = event.call?.args as ScheduledCallArgs | null

  const schedule = callArgs
    ? findNested<ScheduleArgs>(callArgs, "schedule")
    : null

  if (!args || !schedule) return null

  const { order, period, totalAmount } = schedule

  const from = getAsset(order.assetIn)
  const to = getAsset(order.assetOut)

  const rawSingleTradeSize = order.amountIn ?? order.maxAmountIn ?? null
  const isOpenBudget = totalAmount === "0"

  return {
    kind: isOpenBudget ? OrderKind.DcaRolling : OrderKind.Dca,
    scheduleId: args.id,
    from,
    to,
    fromAmountBudget: isOpenBudget
      ? null
      : scaleHuman(totalAmount, from.decimals),
    fromAmountExecuted: null,
    fromAmountRemaining: null,
    singleTradeSize: rawSingleTradeSize
      ? scaleHuman(rawSingleTradeSize, from.decimals)
      : null,
    toAmountExecuted: null,
    status,
    blocksPeriod: String(period),
    isOpenBudget,
    timestamp: blockTimestamp(event),
    limitPrice: null,
  }
}

export const buildScheduleHistoryRows = (
  scheduledEvents: ReadonlyArray<IndexerOrderEvent>,
  statusEvents: ReadonlyArray<IndexerOrderEvent>,
  getAsset: GetAsset,
): Array<DcaOrderData> => {
  const statusMap = new Map<number, OrderStatus>()

  statusEvents.forEach((event) => {
    const args = event.args as StatusEventArgs | null
    if (!args) return

    if (event.name === "DCA.Terminated") {
      statusMap.set(args.id, OrderStatus.Terminated)
    } else if (event.name === "DCA.Completed") {
      statusMap.set(args.id, OrderStatus.Completed)
    } else if (event.name === "DCA.MigrationCancelled") {
      statusMap.set(args.id, OrderStatus.MigrationCancelled)
    }
  })

  return scheduledEvents
    .map<DcaOrderData | null>((event) => {
      const args = event.args as ScheduledEventArgs | null
      if (!args) return null

      const status = statusMap.get(args.id)
      if (!status) return null

      return scheduleEventToOrder(event, status, getAsset)
    })
    .filter(isNonNullish)
}

type IntentFillEventArgs = {
  id?: string | number
  amountIn?: string
  amountOut?: string
}

export type IntentFillTotals = {
  readonly amountIn: bigint
  readonly amountOut: bigint
}

export const sumIntentFills = (
  events: ReadonlyArray<IndexerOrderEvent>,
): Map<string, IntentFillTotals> => {
  const totals = new Map<string, IntentFillTotals>()

  events.forEach((event) => {
    const args = event.args as IntentFillEventArgs | null
    if (!args?.id) return
    if (args.amountIn === undefined && args.amountOut === undefined) return

    const id = String(args.id)
    const current = totals.get(id) ?? { amountIn: 0n, amountOut: 0n }

    totals.set(id, {
      amountIn: current.amountIn + BigInt(args.amountIn ?? 0),
      amountOut: current.amountOut + BigInt(args.amountOut ?? 0),
    })
  })

  return totals
}

export const enrichIntentOrders = (
  orders: ReadonlyArray<OrderData>,
  totals: ReadonlyMap<string, IntentFillTotals>,
): Array<OrderData> =>
  orders.map((order) => {
    if (!isIntentOrder(order)) return order

    const fills = totals.get(String(order.intentId))
    if (!fills) return order

    const toAmountExecuted =
      fills.amountOut > 0n
        ? scaleHuman(fills.amountOut, order.to.decimals)
        : order.toAmountExecuted

    const takesIndexerSellSide =
      order.kind === OrderKind.DcaRolling && order.fromAmountExecuted === null

    const fromAmountExecuted =
      takesIndexerSellSide && fills.amountIn > 0n
        ? scaleHuman(fills.amountIn, order.from.decimals)
        : order.fromAmountExecuted

    return { ...order, fromAmountExecuted, toAmountExecuted }
  })

type IndexerIntentPayload = {
  assetIn: number
  assetOut: number
  amountIn: string
  amountOut: string
  partial?: { __kind: string; value?: string }
  slippage?: number
  budget?: string
  remainingBudget?: string
  period?: number
  lastExecutionBlock?: number
}

type IntentSubmittedArgs = {
  id: string
  owner?: string
  intent: {
    deadline?: string
    data: { __kind: string; value: IndexerIntentPayload }
  }
}

export const intentSubmittedToEntry = (
  args: IntentSubmittedArgs,
): AccountIntentEntry | null => {
  const { data, deadline } = args.intent
  const value = data.value
  const common = {
    asset_in: value.assetIn,
    asset_out: value.assetOut,
    amount_in: BigInt(value.amountIn),
    amount_out: BigInt(value.amountOut),
  }
  const intent = {
    deadline: deadline !== undefined ? BigInt(deadline) : undefined,
    on_resolved: undefined,
  }

  if (data.__kind === "Swap") {
    return {
      id: BigInt(args.id),
      intent: {
        ...intent,
        data: {
          type: "Swap",
          value: {
            ...common,
            partial:
              value.partial?.__kind === "Yes"
                ? { type: "Yes", value: BigInt(value.partial.value ?? 0) }
                : { type: "No", value: undefined },
          },
        },
      },
    }
  }

  if (data.__kind === "Dca") {
    return {
      id: BigInt(args.id),
      intent: {
        ...intent,
        data: {
          type: "Dca",
          value: {
            ...common,
            slippage: value.slippage ?? 0,
            budget:
              value.budget !== undefined ? BigInt(value.budget) : undefined,
            remaining_budget: BigInt(value.remainingBudget ?? 0),
            period: value.period ?? 0,
            last_execution_block: value.lastExecutionBlock ?? 0,
          },
        },
      },
    }
  }

  return null
}

type IntentTerminalEvent = {
  readonly status: OrderStatus
  readonly resolvedBlock: number | null
}

const withHistoryFills = (
  order: IntentLimitOrderData | IntentDcaOrderData,
  { status, resolvedBlock }: IntentTerminalEvent,
  fills: IntentFillTotals | undefined,
): IntentLimitOrderData | IntentDcaOrderData => {
  const fromAmountExecuted =
    fills && fills.amountIn > 0n
      ? scaleHuman(fills.amountIn, order.from.decimals)
      : null
  const toAmountExecuted =
    fills && fills.amountOut > 0n
      ? scaleHuman(fills.amountOut, order.to.decimals)
      : null
  const fromAmountRemaining =
    order.fromAmountBudget !== null && fromAmountExecuted !== null
      ? Big(order.fromAmountBudget).minus(fromAmountExecuted).toString()
      : order.fromAmountBudget

  const filled = {
    status,
    resolvedBlock,
    fromAmountExecuted,
    toAmountExecuted,
    fromAmountRemaining,
  }

  return { ...order, ...filled }
}

export const buildIntentHistoryRows = (
  submittedEvents: ReadonlyArray<IndexerOrderEvent>,
  followUpEvents: ReadonlyArray<IndexerOrderEvent>,
  getAsset: GetAsset,
): Array<IntentLimitOrderData | IntentDcaOrderData> => {
  const totals = sumIntentFills(followUpEvents)
  const terminals = new Map<string, IntentTerminalEvent>()

  followUpEvents.forEach((event) => {
    const args = event.args as IntentFillEventArgs | null
    if (!args?.id) return

    const status = toIntentOrderStatus(event.name)
    if (!status) return

    terminals.set(String(args.id), {
      status,
      resolvedBlock: event.block?.height ?? null,
    })
  })

  return submittedEvents
    .map<IntentLimitOrderData | IntentDcaOrderData | null>((event) => {
      const args = event.args as IntentSubmittedArgs | null
      if (!args?.id) return null

      const terminal = terminals.get(String(args.id))
      if (!terminal) return null

      const entry = intentSubmittedToEntry(args)
      if (!entry) return null

      const order = intentEntryToOrder(entry, getAsset)
      if (!order || !isIntentOrder(order)) return null

      return withHistoryFills(order, terminal, totals.get(String(args.id)))
    })
    .filter(isNonNullish)
}

export type MigrationLink = {
  readonly scheduleId: number
  readonly intentId: string
}

type MigratedEventArgs = {
  id?: number
  intentId?: string
}

export const toMigrationLinks = (
  events: ReadonlyArray<IndexerOrderEvent>,
): Array<MigrationLink> =>
  events.flatMap<MigrationLink>((event) => {
    if (event.name !== "DCA.Migrated") return []

    const args = event.args as MigratedEventArgs | null
    if (args?.id === undefined || !args.intentId) return []

    return [{ scheduleId: args.id, intentId: String(args.intentId) }]
  })

export const buildMigratedScheduleHalves = (
  scheduledEvents: ReadonlyArray<IndexerOrderEvent>,
  migratedEvents: ReadonlyArray<IndexerOrderEvent>,
  getAsset: GetAsset,
): Array<DcaOrderData> => {
  const migratedIds = new Set(
    toMigrationLinks(migratedEvents).map((link) => link.scheduleId),
  )

  return scheduledEvents
    .map<DcaOrderData | null>((event) => {
      const args = event.args as ScheduledEventArgs | null
      if (!args || !migratedIds.has(args.id)) return null

      return scheduleEventToOrder(event, null, getAsset)
    })
    .filter(isNonNullish)
}

const addAmounts = (a: string | null, b: string | null): string | null =>
  a === null && b === null
    ? null
    : Big(a ?? 0)
        .plus(b ?? 0)
        .toString()

const mergeHalves = (
  half: DcaOrderData,
  intent: IntentDcaOrderData,
): MergedOrderData => ({
  kind: half.kind,
  scheduleId: half.scheduleId,
  intentId: intent.intentId,
  from: intent.from,
  to: intent.to,
  fromAmountBudget: half.fromAmountBudget,
  isOpenBudget: half.isOpenBudget,
  timestamp: half.timestamp,
  status: intent.status,
  fromAmountRemaining: intent.fromAmountRemaining,
  fromAmountExecuted: addAmounts(
    half.fromAmountExecuted,
    intent.fromAmountExecuted,
  ),
  toAmountExecuted: addAmounts(half.toAmountExecuted, intent.toAmountExecuted),
  singleTradeSize: intent.singleTradeSize ?? half.singleTradeSize,
  blocksPeriod: intent.blocksPeriod ?? half.blocksPeriod,
  limitPrice: intent.limitPrice,
})

export const mergeMigratedOrders = (
  orders: ReadonlyArray<OrderData>,
  scheduleHalves: ReadonlyArray<DcaOrderData>,
  links: ReadonlyArray<MigrationLink>,
): Array<OrderData> => {
  if (!links.length) return [...orders]

  const halfById = new Map(
    scheduleHalves.map((half) => [half.scheduleId, half] as const),
  )
  const intentById = new Map(
    orders
      .filter(isIntentOrder)
      .map((order) => [String(order.intentId), order] as const),
  )

  const mergedByIntentId = new Map<string, MergedOrderData>()
  const mergedScheduleIds = new Set<number>()

  links.forEach(({ scheduleId, intentId }) => {
    const half = halfById.get(scheduleId)
    const intent = intentById.get(intentId)
    if (!half || !intent || intent.kind === OrderKind.Limit) return

    mergedByIntentId.set(intentId, mergeHalves(half, intent))
    mergedScheduleIds.add(scheduleId)
  })

  return orders.flatMap<OrderData>((order) => {
    if (isIntentOrder(order)) {
      const merged = mergedByIntentId.get(String(order.intentId))
      if (merged) return [merged]
    }

    if (
      isDcaScheduleOrder(order) &&
      !isMergedOrder(order) &&
      mergedScheduleIds.has(order.scheduleId)
    ) {
      return []
    }

    return [order]
  })
}

export type OrderRowsInput = {
  readonly intents?: ReadonlyArray<AccountIntentEntry>
  readonly scheduledEvents?: ReadonlyArray<IndexerOrderEvent>
  readonly statusEvents?: ReadonlyArray<IndexerOrderEvent>
}

export const buildOrderRows = (
  { intents = [], scheduledEvents = [], statusEvents = [] }: OrderRowsInput,
  getAsset: GetAsset,
): Array<OrderData> => [
  ...buildIntentOrderRows(intents, getAsset),
  ...buildScheduleHistoryRows(scheduledEvents, statusEvents, getAsset),
]

export const sortOrdersByCreation = (
  orders: ReadonlyArray<OrderData>,
): Array<OrderData> =>
  [...orders].sort((a, b) => {
    if (a.timestamp === null) return b.timestamp === null ? 0 : 1
    if (b.timestamp === null) return -1

    return b.timestamp - a.timestamp
  })
