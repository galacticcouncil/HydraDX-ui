import { formatNumber } from "@galacticcouncil/utils"
import Big from "big.js"

import { scaleHuman } from "@/utils/formatting"

export type PriceSource = "market" | "user" | "derived"

type RawInput = {
  readonly value: string
  readonly inverted: boolean
  readonly canonical: string
}

export type QuotedPrice = {
  readonly canonical: string
  readonly source: PriceSource
  readonly raw: RawInput | null
  readonly inverted: boolean
}

export type QuotedPriceEvent =
  | { readonly type: "typed"; readonly value: string }
  | {
      readonly type: "pct"
      readonly value: string
      readonly market: string | null
    }
  | { readonly type: "market"; readonly value: string }
  | { readonly type: "resetToMarket"; readonly value: string }
  | { readonly type: "derived"; readonly value: string | null }
  | { readonly type: "flipDenomination" }
  | { readonly type: "flipAssets" }
  | { readonly type: "pairChanged" }

export type QuotedPriceAction =
  | { readonly type: "typed"; readonly value: string }
  | { readonly type: "pct"; readonly value: string }
  | { readonly type: "resetToMarket" }
  | { readonly type: "derived"; readonly value: string | null }
  | { readonly type: "flipDenomination" }
  | { readonly type: "flipAssets" }

export const emptyQuotedPrice = (inverted: boolean): QuotedPrice => ({
  canonical: "",
  source: "market",
  raw: null,
  inverted,
})

export const formatPrice = (value: Big): string =>
  formatNumber(value, undefined, { useGrouping: false })

const invert = (value: string): string | null => {
  try {
    const big = new Big(value)
    return big.gt(0) ? Big(1).div(big).toString() : null
  } catch {
    return null
  }
}

const toDisplay = (canonical: string, inverted: boolean): string | null => {
  if (!canonical) return null

  try {
    const value = inverted ? invert(canonical) : canonical
    if (value === null) return null

    const big = new Big(value)
    return big.gt(0) ? formatPrice(big) : null
  } catch {
    return null
  }
}

export const nextQuotedPrice = (
  state: QuotedPrice,
  event: QuotedPriceEvent,
): QuotedPrice => {
  switch (event.type) {
    case "typed": {
      const canonical = state.inverted ? invert(event.value) : event.value
      if (canonical === null) return state

      return {
        ...state,
        canonical,
        source: "user",
        raw: { value: event.value, inverted: state.inverted, canonical },
      }
    }

    case "pct": {
      if (!event.market) return state

      const trimmed = event.value.trim()
      if (!trimmed) {
        return {
          ...state,
          canonical: event.market,
          source: "market",
          raw: null,
        }
      }

      try {
        const pct = new Big(trimmed)
        if (pct.lte(-100)) return state

        const marketDisplay = toDisplay(event.market, state.inverted)
        if (marketDisplay === null) return state

        const next = new Big(marketDisplay).times(Big(1).plus(pct.div(100)))
        if (next.lte(0)) return state

        const display = formatPrice(next)
        const canonical = state.inverted ? invert(display) : display
        if (canonical === null) return state

        return { ...state, canonical, source: "user", raw: null }
      } catch {
        return state
      }
    }

    case "market":
      return state.source === "market" && state.canonical !== event.value
        ? { ...state, canonical: event.value, raw: null }
        : state

    case "resetToMarket":
      return { ...state, canonical: event.value, source: "market", raw: null }

    case "derived":
      return {
        ...state,
        canonical: event.value ?? "",
        source: "derived",
        raw: null,
      }

    case "flipDenomination":
      return { ...state, inverted: !state.inverted }

    case "flipAssets":
      return {
        ...state,
        canonical: state.canonical ? (invert(state.canonical) ?? "") : "",
        raw: null,
      }

    case "pairChanged":
      return emptyQuotedPrice(state.inverted)
  }
}

export type QuotedPriceView = {
  readonly display: string
  readonly marketDisplay: string | null
  readonly deviationPct: number | null
  readonly inverted: boolean
  readonly canReset: boolean
}

const displayOf = (state: QuotedPrice): string => {
  const { raw } = state
  if (
    raw &&
    raw.inverted === state.inverted &&
    raw.canonical === state.canonical
  ) {
    return raw.value
  }

  return toDisplay(state.canonical, state.inverted) ?? ""
}

const deviationOf = (
  state: QuotedPrice,
  market: string | null,
): number | null => {
  const price = toDisplay(state.canonical, state.inverted)
  const reference = market ? toDisplay(market, state.inverted) : null
  if (price === null || reference === null) return null

  try {
    const big = new Big(reference)
    return big.gt(0)
      ? new Big(price).minus(big).div(big).times(100).toNumber()
      : null
  } catch {
    return null
  }
}

export const viewQuotedPrice = (
  state: QuotedPrice,
  market: string | null,
): QuotedPriceView => ({
  display: displayOf(state),
  marketDisplay: market ? toDisplay(market, state.inverted) : null,
  deviationPct: deviationOf(state, market),
  inverted: state.inverted,
  canReset: state.source !== "market" && market !== null,
})

export const marketPriceFromQuote = (
  quote: { readonly amountIn: bigint; readonly amountOut: bigint } | undefined,
  sellDecimals: number | undefined,
  buyDecimals: number | undefined,
): string | null => {
  if (!quote || sellDecimals === undefined || buyDecimals === undefined) {
    return null
  }

  try {
    const inHuman = Big(scaleHuman(quote.amountIn, sellDecimals))
    const outHuman = Big(scaleHuman(quote.amountOut, buyDecimals))
    if (inHuman.lte(0) || outHuman.lte(0)) return null

    return formatPrice(outHuman.div(inHuman))
  } catch {
    return null
  }
}
