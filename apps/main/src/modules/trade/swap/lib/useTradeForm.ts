import { useEffect } from "react"
import {
  DefaultValues,
  FieldValues,
  useForm,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form"

import { useSwapForm } from "@/states/swapForm"

export type TradeFormValues = FieldValues & { sellAmount: string }

type Props<TFormValues extends TradeFormValues> = Omit<
  UseFormProps<TFormValues>,
  "defaultValues"
> & {
  readonly defaultValues: DefaultValues<TFormValues>
}

const getSharedSellAmount = () => useSwapForm.getState().sellAmount

const useSharedSellAmountSync = <TFormValues extends TradeFormValues>(
  form: UseFormReturn<TFormValues>,
) => {
  const setSharedSellAmount = useSwapForm((state) => state.setSellAmount)

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name !== undefined && name !== "sellAmount") {
        return
      }

      const nextSellAmount = values.sellAmount ?? ""

      if (nextSellAmount !== useSwapForm.getState().sellAmount) {
        setSharedSellAmount(nextSellAmount)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [form, setSharedSellAmount])
}

/** Seeds `sellAmount` from the shared store and keeps it in sync across tabs. */
export const useTradeForm = <TFormValues extends TradeFormValues>(
  props: Props<TFormValues>,
): UseFormReturn<TFormValues> => {
  const form = useForm<TFormValues>({
    ...props,
    defaultValues: {
      ...props.defaultValues,
      sellAmount: getSharedSellAmount(),
    } as DefaultValues<TFormValues>,
  })

  useSharedSellAmountSync(form)

  return form
}
