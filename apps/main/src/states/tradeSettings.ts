import {
  CANDLE_BUCKETS,
  CandleBucket,
  PRICE_CHANGE_PERIODS,
  PriceChangePeriod,
} from "@galacticcouncil/indexer/neckwork"
import { createZustandStorage, safeParse } from "@galacticcouncil/utils"
import * as z from "zod/v4"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import i18n from "@/i18n"
import {
  TRADE_CHART_TYPES,
  TradeChartType,
} from "@/modules/trade/swap/components/TradeChart/TradeChart.utils"
import { validNumber } from "@/utils/validators"

const legacyTradeSettingsSchema = z.object({
  slippage: z.string().or(z.number()),
  slippageTwap: z.string().or(z.number()),
  maxRetries: z.string().or(z.number()),
})

const legacyDcaSettingsSchema = z.object({
  slippage: z.string().or(z.number()),
  maxRetries: z.string().or(z.number()),
})

const generalSettingsSchema = z.object({
  isSummaryExpanded: z.boolean(),
})

const slippageSchema = validNumber.min(0).max(100)
const maxRetriesSchema = validNumber.min(0).max(10)

export const MIN_TRADE_SLIPPAGE = 0.5

const tradeSlippageSchema = validNumber
  .min(
    MIN_TRADE_SLIPPAGE,
    i18n.t("error.minNumber", { value: MIN_TRADE_SLIPPAGE }),
  )
  .max(100)

export const singleTradeSchema = z.object({
  swapSlippage: tradeSlippageSchema,
})

export type SingleTradeSettings = z.infer<typeof singleTradeSchema>

export const splitTradeSchema = z.object({
  twapSlippage: tradeSlippageSchema,
  twapMaxRetries: maxRetriesSchema,
})

export type SplitTradeSettings = z.infer<typeof splitTradeSchema>

export const swapSettingsSchema = z.object({
  single: singleTradeSchema,
  split: splitTradeSchema,
})

export type SwapSettings = z.infer<typeof swapSettingsSchema>

export const dcaOrderSchema = z.object({
  slippage: tradeSlippageSchema,
  maxRetries: maxRetriesSchema,
})

export const chartSettingsSchema = z.object({
  interval: z.enum(CANDLE_BUCKETS),
  chartType: z.enum(TRADE_CHART_TYPES),
  changePeriod: z.enum(PRICE_CHANGE_PERIODS),
})

export type ChartSettings = z.infer<typeof chartSettingsSchema>

export const liquidityLimitSchema = z.object({
  slippage: slippageSchema,
})

export type DcaOrderSettings = z.infer<typeof dcaOrderSchema>

export const tradeSettingsSchema = z.object({
  general: generalSettingsSchema,
  swap: swapSettingsSchema,
  dca: dcaOrderSchema,
  liquidity: liquidityLimitSchema,
  chart: chartSettingsSchema,
})

export type TradeSettings = z.infer<typeof tradeSettingsSchema>

export const defaultChartSettings: ChartSettings = {
  interval: "1h",
  chartType: "candles",
  changePeriod: "24h",
}

const defaultState: TradeSettings = {
  general: { isSummaryExpanded: false },
  swap: {
    single: {
      swapSlippage: 1,
    },
    split: {
      twapSlippage: 3,
      twapMaxRetries: 5,
    },
  },
  liquidity: {
    slippage: 3,
  },
  dca: {
    slippage: 1,
    maxRetries: 5,
  },
  chart: defaultChartSettings,
}

type TradeSettingsStore = TradeSettings & {
  update: (values: TradeSettings) => void
}

export const useTradeSettings = create<TradeSettingsStore>()(
  persist(
    (set) => ({
      ...defaultState,
      update: (values) => set(values),
    }),
    createZustandStorage({
      name: "trade-settings",
      version: 2,
      schema: tradeSettingsSchema,
      defaultState,
      migrate: (persistedState, storedVersion) => {
        switch (storedVersion) {
          case 0:
            return migrateLegacySettings()
          case 1:
            return migrateDcaSettingsToSplit(persistedState as TradeSettings)
          default:
            return persistedState as TradeSettings
        }
      },
    }),
  ),
)

const LEGACY_TRADE_SETTINGS_STORE = "trade.settings"
const LEGACY_DCA_SETTINGS_STORE = "dca.settings"

function migrateLegacySettings() {
  const rawTrade = window.localStorage.getItem(LEGACY_TRADE_SETTINGS_STORE)
  const legacyTrade = legacyTradeSettingsSchema.safeParse(
    rawTrade ? safeParse(rawTrade) : null,
  )

  const rawDca = window.localStorage.getItem(LEGACY_DCA_SETTINGS_STORE)
  const legacyDca = legacyDcaSettingsSchema.safeParse(
    rawDca ? safeParse(rawDca) : null,
  )

  if (legacyTrade.success) {
    window.localStorage.removeItem(LEGACY_TRADE_SETTINGS_STORE)
  }

  if (legacyDca.success) {
    window.localStorage.removeItem(LEGACY_DCA_SETTINGS_STORE)
  }

  return {
    ...defaultState,
    swap: legacyTrade.success
      ? {
          single: { swapSlippage: Number(legacyTrade.data.slippage) },
          split: {
            twapSlippage: Number(legacyTrade.data.slippageTwap),
            twapMaxRetries: Number(legacyTrade.data.maxRetries),
          },
        }
      : legacyDca.success
        ? {
            ...defaultState.swap,
            split: {
              twapSlippage: Number(legacyDca.data.slippage),
              twapMaxRetries: Number(legacyDca.data.maxRetries),
            },
          }
        : defaultState.swap,
    dca: legacyDca.success
      ? {
          slippage: Number(legacyDca.data.slippage),
          maxRetries: Number(legacyDca.data.maxRetries),
        }
      : defaultState.dca,
  }
}

function migrateDcaSettingsToSplit(state: TradeSettings): TradeSettings {
  const splitIsDefault =
    state.swap.split.twapSlippage === defaultState.swap.split.twapSlippage &&
    state.swap.split.twapMaxRetries === defaultState.swap.split.twapMaxRetries

  const dcaWasCustomized =
    state.dca.slippage !== defaultState.dca.slippage ||
    state.dca.maxRetries !== defaultState.dca.maxRetries

  if (!splitIsDefault || !dcaWasCustomized) {
    return state
  }

  return {
    ...state,
    swap: {
      ...state.swap,
      split: {
        twapSlippage: state.dca.slippage,
        twapMaxRetries: state.dca.maxRetries,
      },
    },
  }
}

const guard = <T extends string>(
  options: readonly T[],
  value: string,
  fallback: T,
): T => (options.includes(value as T) ? (value as T) : fallback)

export const useTradeChartSettings = () => {
  const { update, ...settings } = useTradeSettings()
  const { chart } = settings

  const setChart = (values: Partial<ChartSettings>) =>
    update({ ...settings, chart: { ...chart, ...values } })

  return {
    interval: guard(
      CANDLE_BUCKETS,
      chart.interval,
      defaultChartSettings.interval,
    ),
    chartType: guard(
      TRADE_CHART_TYPES,
      chart.chartType,
      defaultChartSettings.chartType,
    ),
    changePeriod: guard(
      PRICE_CHANGE_PERIODS,
      chart.changePeriod,
      defaultChartSettings.changePeriod,
    ),
    setInterval: (interval: CandleBucket) => setChart({ interval }),
    setChartType: (chartType: TradeChartType) => setChart({ chartType }),
    setChangePeriod: (changePeriod: PriceChangePeriod) =>
      setChart({ changePeriod }),
  }
}
