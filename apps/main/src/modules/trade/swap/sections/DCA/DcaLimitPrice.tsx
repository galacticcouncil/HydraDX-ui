import {
  Flex,
  Text,
  Toggle,
  ToggleLabel,
  ToggleRoot,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { QuotedPriceField } from "@/modules/trade/swap/components/QuotedPriceField/QuotedPriceField"
import { QuotedPriceBinding } from "@/modules/trade/swap/lib/quotedPrice.hook"
import { DcaFormValues } from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"

type Props = {
  readonly quotedPrice: QuotedPriceBinding
}

export const DcaLimitPrice: FC<Props> = ({ quotedPrice }) => {
  const { t } = useTranslation(["trade", "common"])
  const { watch, setValue } = useFormContext<DcaFormValues>()
  const { view } = quotedPrice

  const [limitEnabled, sellAsset, buyAsset] = watch([
    "limitEnabled",
    "sellAsset",
    "buyAsset",
  ])

  return (
    <Flex direction="column">
      <Flex justify="space-between" align="center" py="base">
        <Text fw={400} fs="p5" color={getToken("text.medium")}>
          {t("trade:dca.limit.title")}
        </Text>
        <ToggleRoot>
          <ToggleLabel
            htmlFor="limitEnabled"
            color={
              limitEnabled
                ? getToken("text.tint.secondary")
                : getToken("text.low")
            }
          >
            {t(
              limitEnabled
                ? "trade:dca.limit.enabled"
                : "trade:dca.limit.disabled",
            )}
          </ToggleLabel>
          <Toggle
            name="limitEnabled"
            checked={limitEnabled}
            onCheckedChange={(checked) => setValue("limitEnabled", !!checked)}
          />
        </ToggleRoot>
      </Flex>

      {limitEnabled && (
        <>
          <SwapSectionSeparator />
          <QuotedPriceField
            binding={quotedPrice}
            baseAssetId={view.inverted ? buyAsset?.id : sellAsset?.id}
            baseSymbol={
              (view.inverted ? buyAsset?.symbol : sellAsset?.symbol) ?? ""
            }
            quoteSymbol={
              (view.inverted ? sellAsset?.symbol : buyAsset?.symbol) ?? ""
            }
            marketLabel={t("trade:dca.limit.spot")}
          />
        </>
      )}
    </Flex>
  )
}
