import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useFormContext } from "react-hook-form"

import {
  FieldName,
  LastTwo,
} from "@/modules/trade/swap/sections/Limit/cascadeLogic"
import { LimitFormValues } from "@/modules/trade/swap/sections/Limit/useLimitForm"

const flipAmountSidesInLastTwo = (lastTwo: LastTwo): LastTwo => {
  const flip = (f: FieldName): FieldName =>
    f === "sell" ? "buy" : f === "buy" ? "sell" : "price"
  return [flip(lastTwo[0]), flip(lastTwo[1])]
}

export const useSwitchAssets = () => {
  const navigate = useNavigate()
  const { reset, getValues, trigger } = useFormContext<LimitFormValues>()

  return useMutation({
    mutationFn: async () => {
      const values = getValues()
      const { sellAsset, buyAsset, sellAmount, buyAmount, lastTwo } = values

      reset({
        ...values,
        sellAsset: buyAsset,
        buyAsset: sellAsset,
        sellAmount: buyAmount,
        buyAmount: sellAmount,
        lastTwo: flipAmountSidesInLastTwo(lastTwo),
      })

      trigger()

      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: buyAsset?.id,
          assetOut: sellAsset?.id,
        }),
        resetScroll: false,
      })
    },
  })
}
