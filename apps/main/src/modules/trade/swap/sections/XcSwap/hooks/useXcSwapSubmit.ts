import { useMemo, useRef } from "react"
import { UseFormReturn } from "react-hook-form"

import { useSubmitSwap } from "@/modules/trade/swap/sections/XcSwap/hooks/useSubmitSwap"
import { useSubmitTwap } from "@/modules/trade/swap/sections/XcSwap/hooks/useSubmitTwap"
import { useSubmitXcSwap } from "@/modules/trade/swap/sections/XcSwap/hooks/useSubmitXcSwap"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import {
  resetXcSwapForm,
  shouldResetXcSwapFormAfterSubmit,
} from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapFormReset"
import { XcSwapQuote } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapQuote"
import { SwapSubmitValues } from "@/modules/trade/swap/sections/XcSwap/types"
import { useAssets } from "@/providers/assetsProvider"
import { TransactionActions } from "@/states/transactions"

type SubmitSnapshot = {
  readonly sellAmount: string
  readonly maxSellBalance: string
}

type UseXcSwapSubmitParams = {
  form: UseFormReturn<XcSwapFormValues>
  quote: XcSwapQuote
  maxSwapSellBalance: string
  maxTwapSellBalance: string
}

export const useXcSwapSubmit = ({
  form,
  quote,
  maxSwapSellBalance,
  maxTwapSellBalance,
}: UseXcSwapSubmitParams) => {
  const { getAsset } = useAssets()
  const onSubmitRef = useRef<(() => void) | undefined>(undefined)
  const submitSnapshotRef = useRef<SubmitSnapshot | null>(null)

  const transactionActions = useMemo<TransactionActions>(
    () => ({
      onSubmitted: () => onSubmitRef.current?.(),
    }),
    [],
  )

  const submit = useSubmitXcSwap(transactionActions)
  const submitOmnipool = useSubmitSwap(transactionActions)
  const submitTwap = useSubmitTwap(transactionActions)

  onSubmitRef.current = () => {
    const snapshot = submitSnapshotRef.current

    if (
      !snapshot ||
      shouldResetXcSwapFormAfterSubmit(
        snapshot.sellAmount,
        snapshot.maxSellBalance,
      )
    ) {
      resetXcSwapForm(form, { clearDestAddress: true })
    }

    submitSnapshotRef.current = null
    submit.reset()
    submitOmnipool.reset()
    submitTwap.reset()
  }

  const toSwapSubmitValues = (values: XcSwapFormValues): SwapSubmitValues => ({
    sellAsset: values.sellAsset,
    sellAmount: values.sellAmount,
    buyAsset:
      values.buyAsset?.id !== undefined
        ? (getAsset(String(values.buyAsset.id)) ?? null)
        : null,
    buyAmount: values.buyAmount,
    type: values.type,
    isSingleTrade: values.isSingleTrade,
  })

  const onSubmit = (values: XcSwapFormValues) => {
    submitSnapshotRef.current = {
      sellAmount: values.sellAmount,
      maxSellBalance: values.isSingleTrade
        ? maxSwapSellBalance
        : maxTwapSellBalance,
    }

    if (quote?.kind === "xc") {
      submit.mutate([values, quote.swap])
    } else if (quote?.kind === "oc" && values.isSingleTrade) {
      submitOmnipool.mutate([toSwapSubmitValues(values), quote.swap])
    } else if (quote?.kind === "oc" && quote.twap) {
      submitTwap.mutate([toSwapSubmitValues(values), quote.twap])
    }
  }

  const isSubmitting =
    submit.isPending || submitOmnipool.isPending || submitTwap.isPending

  return { onSubmit, isSubmitting }
}
