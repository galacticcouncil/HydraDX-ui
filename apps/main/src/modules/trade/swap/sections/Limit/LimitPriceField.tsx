import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { QuotedPriceField } from "@/modules/trade/swap/components/QuotedPriceField/QuotedPriceField"
import { QuotedPriceBinding } from "@/modules/trade/swap/lib/quotedPrice.hook"
import { LimitFormValues } from "@/modules/trade/swap/sections/Limit/useLimitForm"

type Props = {
  readonly quotedPrice: QuotedPriceBinding
}

export const LimitPriceField: FC<Props> = ({ quotedPrice }) => {
  const { t } = useTranslation(["common", "trade"])
  const { watch } = useFormContext<LimitFormValues>()

  const [sellAsset, buyAsset] = watch(["sellAsset", "buyAsset"])
  const { inverted } = quotedPrice.view

  return (
    <QuotedPriceField
      binding={quotedPrice}
      baseAssetId={inverted ? buyAsset?.id : sellAsset?.id}
      baseSymbol={(inverted ? buyAsset?.symbol : sellAsset?.symbol) ?? ""}
      quoteSymbol={(inverted ? sellAsset?.symbol : buyAsset?.symbol) ?? ""}
      marketLabel={t("trade:limit.market")}
    />
  )
}
