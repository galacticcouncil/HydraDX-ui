import { Alert, Flex } from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Trade } from "@/api/trade"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"

type Props = {
  readonly swap: Trade
}

export const TradeErrors: FC<Props> = ({ swap }) => {
  const { t } = useTranslation("trade")

  const { watch } = useFormContext<XcSwapFormValues>()
  const isSingleTrade = watch("isSingleTrade")

  if (!isSingleTrade) {
    return null
  }

  const errors = swap?.swaps.flatMap((swap) => swap.errors)
  const error = errors?.[0]

  if (!error) {
    return null
  }

  const message = ((): string => {
    switch (error) {
      case "InsufficientTradingAmount":
        return t("market.error.insufficientTradingAmount")
      case "MaxOutRatioExceeded":
        return t("market.error.maxOutRatioExceeded")
      case "MaxInRatioExceeded":
        return t("market.error.maxInRatioExceeded")
      case "TradeNotAllowed":
        return t("market.error.tradeNotAllowed")
      default:
        return error
    }
  })()

  return (
    <Flex mt="base">
      <Alert variant="error" description={message} />
    </Flex>
  )
}
