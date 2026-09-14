import { getTimeFrameMillis } from "@galacticcouncil/main/src/components/TimeFrame/TimeFrame.utils"
import { TradeDcaOrder } from "@galacticcouncil/sdk-next/sor"
import {
  Flex,
  Summary,
  SummaryRowLabel,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"

import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { QuotedPriceBinding } from "@/modules/trade/swap/lib/quotedPrice.hook"
import { DcaSummarySkeleton } from "@/modules/trade/swap/sections/DCA/DcaSummarySkeleton"
import {
  DcaFormValues,
  DcaOrdersMode,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { useAssets } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

type Props = {
  readonly order: TradeDcaOrder | undefined | null
  readonly isLoading: boolean
  readonly quotedPrice: QuotedPriceBinding
}

export const DcaSummary: FC<Props> = ({ order, isLoading, quotedPrice }) => {
  const { t } = useTranslation(["common", "trade"])
  const { watch } = useFormContext<DcaFormValues>()
  const { getAsset } = useAssets()

  const buyAsset = order ? getAsset(order.assetOut) : undefined
  const sellAsset = order ? getAsset(order.assetIn) : undefined

  const now = Date.now()

  const [durationTimeFrame, type, limitEnabled] = watch([
    "duration",
    "orders.type",
    "limitEnabled",
  ])
  const isOpenBudget = type === DcaOrdersMode.OpenBudget
  const duration = getTimeFrameMillis(durationTimeFrame)
  const frequency =
    order && order.tradeCount > 0 ? duration / order.tradeCount : 0

  const endDate = new Date(now + duration)
  const endDateValid = !isNaN(endDate.valueOf())

  if (isLoading) {
    return <DcaSummarySkeleton />
  }

  if (!order || !sellAsset || !buyAsset) {
    return null
  }

  const tradeAmountIn = scaleHuman(order.tradeAmountIn, sellAsset.decimals)

  return (
    <div>
      <Flex direction="column" gap="base" py="base">
        <SummaryRowLabel>{t("summary")}</SummaryRowLabel>
        <Text fw={500} fs="p4" lh={1.4} color={getToken("text.high")}>
          <Trans
            t={t}
            i18nKey={
              isOpenBudget
                ? "trade:dca.summary.openBudget.description"
                : "trade:dca.summary.limitedBudget.description"
            }
            values={{
              sellAmount: t("currency", {
                value: tradeAmountIn,
                symbol: sellAsset.symbol,
              }),
              buySymbol: buyAsset.symbol,
              frequency: t("interval", { value: frequency }),
              duration: t("interval", { value: duration }),
            }}
          >
            <Text fw={600} as="span" color={getToken("text.tint.secondary")} />
          </Trans>
        </Text>
        {limitEnabled && quotedPrice.view.display && (
          <Text fw={500} fs="p4" lh={1.4} color={getToken("text.high")}>
            <Trans
              t={t}
              i18nKey={
                quotedPrice.view.inverted
                  ? "trade:dca.summary.limitClause"
                  : "trade:dca.summary.limitClauseAbove"
              }
              values={{
                buySymbol: buyAsset.symbol,
                price: quotedPrice.view.display,
                sellSymbol: sellAsset.symbol,
              }}
            >
              <Text
                fw={600}
                as="span"
                color={getToken("text.tint.secondary")}
              />
            </Trans>
          </Text>
        )}
      </Flex>
      <SwapSectionSeparator sx={{ mt: "s" }} />
      <Summary separator={<SwapSectionSeparator />}>
        {endDateValid && (
          <SwapSummaryRow
            label={t("trade:dca.summary.scheduleEnd")}
            content={t("date.datetime.short", {
              value: endDate,
            })}
          />
        )}
      </Summary>
    </div>
  )
}
