import Big from "big.js"
import { describe, expect, it } from "vitest"

import {
  emptyQuotedPrice,
  marketPriceFromQuote,
  nextQuotedPrice,
  QuotedPrice,
  QuotedPriceEvent,
  viewQuotedPrice,
} from "@/modules/trade/swap/lib/quotedPrice"

const run = (
  state: QuotedPrice,
  ...events: ReadonlyArray<QuotedPriceEvent>
): QuotedPrice => events.reduce(nextQuotedPrice, state)

const direct = emptyQuotedPrice(false)
const flipped = emptyQuotedPrice(true)

describe("market anchoring", () => {
  it("mirrors the quote while anchored", () => {
    const state = run(direct, { type: "market", value: "2" })

    expect(state.canonical).toBe("2")
    expect(state.source).toBe("market")
  })

  it("stops mirroring once the price has another source", () => {
    const typed = run(
      direct,
      { type: "typed", value: "3" },
      { type: "market", value: "2.5" },
    )
    const derived = run(
      direct,
      { type: "derived", value: "4" },
      { type: "market", value: "2.5" },
    )

    expect(typed.canonical).toBe("3")
    expect(derived.canonical).toBe("4")
  })

  it("re-anchors on an explicit reset", () => {
    const state = run(
      direct,
      { type: "typed", value: "3" },
      { type: "resetToMarket", value: "2" },
      { type: "market", value: "2.5" },
    )

    expect(state.canonical).toBe("2.5")
  })
})

describe("reset affordance", () => {
  it("shows only when the price is off market and there is a market", () => {
    const atMarket = run(direct, { type: "market", value: "2" })
    const offMarket = run(direct, { type: "typed", value: "3" })

    expect(viewQuotedPrice(atMarket, "2").canReset).toBe(false)
    expect(viewQuotedPrice(offMarket, "2").canReset).toBe(true)
    expect(viewQuotedPrice(offMarket, null).canReset).toBe(false)
  })
})

describe("denomination", () => {
  it("inverts what the user types when shown the other way round", () => {
    const state = run(flipped, { type: "typed", value: "4" })

    expect(state.canonical).toBe("0.25")
    expect(viewQuotedPrice(state, null).display).toBe("4")
  })

  it("flips the display without touching the canonical value", () => {
    const state = run(
      direct,
      { type: "typed", value: "4" },
      { type: "flipDenomination" },
    )

    expect(state.canonical).toBe("4")
    expect(viewQuotedPrice(state, null).display).toBe("0.25")
  })

  it("round-trips a typed value across a flip and back", () => {
    const state = run(
      direct,
      { type: "typed", value: "0.0000125" },
      { type: "flipDenomination" },
      { type: "flipDenomination" },
    )

    expect(viewQuotedPrice(state, null).display).toBe("0.0000125")
  })
})

describe("the ± pill is an input method, not a source", () => {
  it("sets the price once, relative to the displayed market price", () => {
    const state = run(direct, { type: "pct", value: "10", market: "2" })

    expect(new Big(state.canonical).toNumber()).toBeCloseTo(2.2)
    expect(state.source).toBe("user")
  })

  it("reports the true deviation as the market moves away", () => {
    const state = run(direct, { type: "pct", value: "10", market: "2" })

    expect(viewQuotedPrice(state, "2").deviationPct).toBeCloseTo(10)
    expect(viewQuotedPrice(state, "2.2").deviationPct).toBeCloseTo(0)
  })

  it("applies the percentage to the number on screen when flipped", () => {
    const state = run(flipped, { type: "pct", value: "10", market: "2" })

    expect(viewQuotedPrice(state, "2").display).toBe("0.55")
    expect(viewQuotedPrice(state, "2").deviationPct).toBeCloseTo(10)
  })

  it("re-anchors to market when cleared", () => {
    const state = run(
      direct,
      { type: "pct", value: "10", market: "2" },
      { type: "pct", value: "  ", market: "2" },
    )

    expect(state.canonical).toBe("2")
    expect(state.source).toBe("market")
  })

  it("keeps the price when the percentage is unusable", () => {
    const base = run(direct, { type: "typed", value: "3" })

    const tooNegative = run(base, { type: "pct", value: "-100", market: "2" })
    const notANumber = run(base, { type: "pct", value: "x", market: "2" })

    expect(tooNegative.canonical).toBe("3")
    expect(notANumber.canonical).toBe("3")
  })
})

describe("raw keystrokes", () => {
  it("echoes what was typed, then formats again once the value moves", () => {
    const typing = run(direct, { type: "typed", value: "0.00012000" })
    const reset = run(typing, { type: "resetToMarket", value: "2.5000" })

    expect(viewQuotedPrice(typing, null).display).toBe("0.00012000")
    expect(viewQuotedPrice(reset, null).display).toBe("2.5")
  })
})

describe("pair changes", () => {
  it("inverts the price when the assets swap places", () => {
    const state = run(
      direct,
      { type: "typed", value: "4" },
      { type: "flipAssets" },
    )

    expect(state.canonical).toBe("0.25")
  })

  it("clears the price for a different pair but keeps the denomination", () => {
    const state = run(
      flipped,
      { type: "typed", value: "4" },
      { type: "pairChanged" },
    )

    expect(state.canonical).toBe("")
    expect(state.source).toBe("market")
    expect(state.inverted).toBe(true)
  })
})

describe("marketPriceFromQuote", () => {
  it("returns BUY per SELL, accounting for decimals", () => {
    const price = marketPriceFromQuote(
      { amountIn: 1_000_000_000_000n, amountOut: 2_000_000n },
      12,
      6,
    )

    expect(price).toBe("2")
  })

  it("returns null without a usable quote", () => {
    expect(marketPriceFromQuote({ amountIn: 0n, amountOut: 1n }, 12, 6)).toBe(
      null,
    )
    expect(marketPriceFromQuote(undefined, 12, 6)).toBe(null)
  })
})
