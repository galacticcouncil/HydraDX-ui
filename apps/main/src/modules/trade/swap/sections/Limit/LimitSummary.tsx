import {
  Flex,
  Summary,
  SummaryRowDisplayValue,
  SummaryRowValue,
} from "@galacticcouncil/ui/components"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { clamp } from "remeda"

import { maxIntentDurationQuery } from "@/api/intents"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import {
  EXPIRY_MS,
  LimitFormValues,
} from "@/modules/trade/swap/sections/Limit/useLimitForm"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"

export const LimitSummary: FC = () => {
  const { t } = useTranslation(["common", "trade"])
  const rpc = useRpcProvider()
  const isIceEnabled = useIsIceEnabled()
  const { watch } = useFormContext<LimitFormValues>()

  const [buyAsset, buyAmount, expiry] = watch([
    "buyAsset",
    "buyAmount",
    "expiry",
  ])

  const { data: maxDurationMs } = useQuery(
    maxIntentDurationQuery(rpc, isIceEnabled),
  )

  const [minReceivedDisplay, { isLoading: isMinReceivedDisplayLoading }] =
    useDisplayAssetPrice(buyAsset?.id ?? "", buyAmount || "0")

  if (!buyAsset || !buyAmount || !Big(buyAmount).gt(0)) {
    return null
  }

  // The chain caps intent lifetime, so the picked expiry is clamped on submit.
  const expiryMs = EXPIRY_MS[expiry]
  const effectiveMs =
    expiryMs && maxDurationMs
      ? clamp(expiryMs, { max: maxDurationMs })
      : expiryMs

  return (
    <Summary separator={<SwapSectionSeparator />}>
      <SwapSummaryRow
        label={t("trade:limit.summary.minReceived")}
        loading={isMinReceivedDisplayLoading}
        content={
          <Flex gap="s" align="center" justify="flex-end">
            <SummaryRowValue>
              {t("currency", { value: buyAmount, symbol: buyAsset.symbol })}
            </SummaryRowValue>
            <SummaryRowDisplayValue>
              {t("parenthesized", { value: minReceivedDisplay })}
            </SummaryRowDisplayValue>
          </Flex>
        }
      />
      <SwapSummaryRow
        label={t("trade:limit.summary.expiry")}
        content={
          effectiveMs
            ? t("date.datetime.short", {
                value: new Date(Date.now() + effectiveMs),
              })
            : t("trade:limit.summary.expiry.open")
        }
      />
    </Summary>
  )
}
