import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useCallback, useRef } from "react"
import { useFormContext } from "react-hook-form"

import { bestSellQuery } from "@/api/trade"
import {
  marketPriceFromQuote,
  PriceSource,
} from "@/modules/trade/swap/lib/quotedPrice"
import {
  QuotedPriceBinding,
  useQuotedPrice,
} from "@/modules/trade/swap/lib/quotedPrice.hook"
import {
  computeDerived,
  FieldName,
  getDerived,
  lockSellIntoLastTwo,
  updateLastTwoOnTouch,
} from "@/modules/trade/swap/sections/Limit/cascadeLogic"
import { LimitFormValues } from "@/modules/trade/swap/sections/Limit/useLimitForm"
import { useRpcProvider } from "@/providers/rpcProvider"

const RECALCULATE_DEBOUNCE_MS = 250

type LimitCascade = {
  readonly quotedPrice: QuotedPriceBinding
  readonly onSellAmountChange: () => void
  readonly onBuyAmountChange: () => void
  readonly onLockToggle: () => void
  readonly onAssetChange: (next: Partial<LimitFormValues>) => void
}

export const useLimitCascade = (): LimitCascade => {
  const rpc = useRpcProvider()
  const { reset, getValues, setValue, trigger, watch } =
    useFormContext<LimitFormValues>()

  const [sellAsset, buyAsset, sellAmount] = watch([
    "sellAsset",
    "buyAsset",
    "sellAmount",
  ])

  const sellAmountForQuote =
    sellAmount && Big(sellAmount || "0").gt(0) ? sellAmount : "1"

  const { data: swap } = useQuery(
    bestSellQuery(rpc, {
      assetIn: sellAsset?.id ?? "",
      assetOut: buyAsset?.id ?? "",
      amountIn: sellAmountForQuote,
    }),
  )

  const marketPrice = marketPriceFromQuote(
    swap,
    sellAsset?.decimals,
    buyAsset?.decimals,
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounced = useCallback((fn: () => void) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fn, RECALCULATE_DEBOUNCE_MS)
  }, [])

  const applyPriceTouch = useCallback(
    (newLimitPrice: string) => {
      const values = getValues()
      const lastTwo = updateLastTwoOnTouch(
        values.lastTwo,
        "price",
        values.isLocked,
      )
      if (lastTwo !== values.lastTwo) setValue("lastTwo", lastTwo)
      setValue("limitPrice", newLimitPrice)

      const derived = getDerived(lastTwo)
      if (derived !== "price") {
        const computed = computeDerived(derived, {
          sell: values.sellAmount ?? "",
          buy: values.buyAmount ?? "",
          price: newLimitPrice,
        })
        if (derived === "buy") setValue("buyAmount", computed ?? "")
        else setValue("sellAmount", computed ?? "")
      }
      trigger()
    },
    [getValues, setValue, trigger],
  )

  const applyMarketPrice = useCallback(
    (newLimitPrice: string) => {
      const values = getValues()
      if (values.limitPrice === newLimitPrice) return

      const lastTwo = values.lastTwo.includes("price")
        ? values.lastTwo
        : updateLastTwoOnTouch(values.lastTwo, "price", values.isLocked)
      if (lastTwo !== values.lastTwo) setValue("lastTwo", lastTwo)

      setValue("limitPrice", newLimitPrice)

      const derived = getDerived(lastTwo)
      if (derived === "price") return

      const computed = computeDerived(derived, {
        sell: values.sellAmount ?? "",
        buy: values.buyAmount ?? "",
        price: newLimitPrice,
      })
      if (computed === null) return
      if (derived === "buy") setValue("buyAmount", computed)
      else setValue("sellAmount", computed)
    },
    [getValues, setValue],
  )

  const quotedPrice = useQuotedPrice({
    marketPrice,
    pair: [sellAsset?.id ?? "", buyAsset?.id ?? ""],
    defaultInverted: false,
    onCanonicalChange: (canonical: string, source: PriceSource) => {
      if (source === "derived") return
      if (source === "user") applyPriceTouch(canonical)
      else applyMarketPrice(canonical)
    },
  })

  const { dispatch } = quotedPrice

  const recomputeDerivedField = useCallback(() => {
    const values = getValues()
    const derived = getDerived(values.lastTwo)
    const computed = computeDerived(derived, {
      sell: values.sellAmount ?? "",
      buy: values.buyAmount ?? "",
      price: values.limitPrice ?? "",
    })
    if (derived === "buy") {
      setValue("buyAmount", computed ?? "")
    } else if (derived === "sell") {
      setValue("sellAmount", computed ?? "")
    } else {
      setValue("limitPrice", computed ?? "")
      dispatch({ type: "derived", value: computed })
    }
  }, [getValues, setValue, dispatch])

  const onFieldTouch = useCallback(
    (field: FieldName) => {
      const values = getValues()
      const next = updateLastTwoOnTouch(values.lastTwo, field, values.isLocked)
      if (next !== values.lastTwo) setValue("lastTwo", next)
      if (getDerived(next) === "price") {
        dispatch({ type: "derived", value: values.limitPrice ?? "" })
      }
      debounced(() => {
        recomputeDerivedField()
        trigger()
      })
    },
    [debounced, dispatch, getValues, recomputeDerivedField, setValue, trigger],
  )

  const onSellAmountChange = useCallback(
    () => onFieldTouch("sell"),
    [onFieldTouch],
  )
  const onBuyAmountChange = useCallback(
    () => onFieldTouch("buy"),
    [onFieldTouch],
  )

  const onLockToggle = useCallback(() => {
    const values = getValues()
    const nextLocked = !values.isLocked
    setValue("isLocked", nextLocked)
    if (nextLocked) {
      const next = lockSellIntoLastTwo(values.lastTwo)
      if (next !== values.lastTwo) setValue("lastTwo", next)
      debounced(() => {
        recomputeDerivedField()
        trigger()
      })
    }
  }, [getValues, setValue, debounced, recomputeDerivedField, trigger])

  const onAssetChange = useCallback(
    (next: Partial<LimitFormValues>) => {
      reset({
        ...getValues(),
        ...next,
        ...(next.sellAsset ? { sellAmount: "" } : {}),
        buyAmount: "",
        lastTwo: ["price", "sell"],
      })
    },
    [getValues, reset],
  )

  return {
    quotedPrice,
    onSellAmountChange,
    onBuyAmountChange,
    onLockToggle,
    onAssetChange,
  }
}
