import { useEffect } from "react"

import { useSwapForm } from "@/states/swapForm"

export const useResetSharedSellAmountOnUnmount = () => {
  const setSharedSellAmount = useSwapForm((state) => state.setSellAmount)

  useEffect(() => {
    return () => {
      setSharedSellAmount("")
    }
  }, [setSharedSellAmount])
}
