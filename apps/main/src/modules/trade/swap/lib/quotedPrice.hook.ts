import { useCallback, useEffect, useReducer, useRef } from "react"

import {
  emptyQuotedPrice,
  nextQuotedPrice,
  PriceSource,
  QuotedPriceAction,
  QuotedPriceView,
  viewQuotedPrice,
} from "@/modules/trade/swap/lib/quotedPrice"

type Pair = readonly [sellAssetId: string, buyAssetId: string]

type Args = {
  readonly marketPrice: string | null
  readonly pair: Pair
  readonly defaultInverted: boolean
  readonly onCanonicalChange: (canonical: string, source: PriceSource) => void
}

export type QuotedPriceBinding = {
  readonly view: QuotedPriceView
  readonly dispatch: (action: QuotedPriceAction) => void
}

export const useQuotedPrice = ({
  marketPrice,
  pair,
  defaultInverted,
  onCanonicalChange,
}: Args): QuotedPriceBinding => {
  const [state, dispatchEvent] = useReducer(
    nextQuotedPrice,
    defaultInverted,
    emptyQuotedPrice,
  )

  useEffect(() => {
    if (marketPrice) dispatchEvent({ type: "market", value: marketPrice })
  }, [marketPrice])

  const seenPair = useRef(pair)
  const [sellAssetId, buyAssetId] = pair
  useEffect(() => {
    const [prevSell, prevBuy] = seenPair.current
    if (prevSell === sellAssetId && prevBuy === buyAssetId) return
    seenPair.current = [sellAssetId, buyAssetId]

    dispatchEvent({
      type:
        prevSell === buyAssetId && prevBuy === sellAssetId
          ? "flipAssets"
          : "pairChanged",
    })
  }, [sellAssetId, buyAssetId])

  const notify = useRef(onCanonicalChange)
  notify.current = onCanonicalChange
  useEffect(() => {
    notify.current(state.canonical, state.source)
  }, [state.canonical, state.source])

  const dispatch = useCallback(
    (action: QuotedPriceAction) => {
      if (action.type === "pct") {
        dispatchEvent({ type: "pct", value: action.value, market: marketPrice })
        return
      }

      if (action.type === "resetToMarket") {
        if (marketPrice) {
          dispatchEvent({ type: "resetToMarket", value: marketPrice })
        }
        return
      }

      dispatchEvent(action)
    },
    [marketPrice],
  )

  return { view: viewQuotedPrice(state, marketPrice), dispatch }
}
