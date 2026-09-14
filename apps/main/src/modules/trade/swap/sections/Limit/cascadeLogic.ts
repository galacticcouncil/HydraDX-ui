import Big from "big.js"

import { formatPrice } from "@/modules/trade/swap/lib/quotedPrice"

/** Last-two-wins cascade: `buy = sell × price`; lock keeps sell in the pair. */

export type FieldName = "sell" | "buy" | "price"
export type LastTwo = [FieldName, FieldName]
export const ALL_FIELDS: readonly FieldName[] = ["sell", "buy", "price"]

export const getDerived = (lastTwo: LastTwo): FieldName =>
  ALL_FIELDS.find((f) => f !== lastTwo[0] && f !== lastTwo[1]) as FieldName

export const updateLastTwoOnTouch = (
  prev: LastTwo,
  touched: FieldName,
  isLocked: boolean,
): LastTwo => {
  if (isLocked) {
    if (touched === "sell") {
      const otherKept = prev.find((f) => f !== "sell")
      return ["sell", (otherKept as FieldName | undefined) ?? "price"]
    }
    return [touched, "sell"]
  }
  if (prev[0] === touched) return prev
  return [touched, prev[0]]
}

export const lockSellIntoLastTwo = (prev: LastTwo): LastTwo => {
  if (prev.includes("sell")) return prev
  return [prev[0], "sell"]
}

export interface FieldValues {
  readonly sell: string
  readonly buy: string
  readonly price: string
}

export const computeDerived = (
  derived: FieldName,
  values: FieldValues,
): string | null => {
  try {
    if (derived === "buy") {
      const s = new Big(values.sell || "0")
      const p = new Big(values.price || "0")
      if (s.lte(0) || p.lte(0)) return null
      return formatPrice(s.times(p))
    }
    if (derived === "sell") {
      const b = new Big(values.buy || "0")
      const p = new Big(values.price || "0")
      if (b.lte(0) || p.lte(0)) return null
      return formatPrice(b.div(p))
    }
    const s = new Big(values.sell || "0")
    const b = new Big(values.buy || "0")
    if (s.lte(0) || b.lte(0)) return null
    return formatPrice(b.div(s))
  } catch {
    return null
  }
}
