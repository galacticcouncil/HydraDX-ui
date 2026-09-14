import { SummaryRowValue } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"

type Props = {
  readonly priceImpact: number | null
  readonly label?: string
}

export const PriceImpactSummaryRow: FC<Props> = ({ priceImpact, label }) => {
  const { t } = useTranslation(["common", "trade"])

  const pct = priceImpact || 0

  return (
    <SwapSummaryRow
      label={label ?? t("trade:market.summary.priceImpact")}
      content={
        <SummaryRowValue
          color={
            pct <= -1
              ? getToken("accents.danger.secondary")
              : getToken("text.high")
          }
        >
          {t("percent", { value: pct || 0 })}
        </SummaryRowValue>
      }
      tooltip={t("trade:market.summary.priceImpact.tooltip")}
    />
  )
}
