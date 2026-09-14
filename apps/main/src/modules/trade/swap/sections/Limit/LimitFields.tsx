import { Box, Stack } from "@galacticcouncil/ui/components"
import { SELL_ONLY_ASSETS } from "@galacticcouncil/utils"
import { useNavigate } from "@tanstack/react-router"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { LimitSwitcher } from "@/modules/trade/swap/sections/Limit/LimitSwitcher"
import { LimitFormValues } from "@/modules/trade/swap/sections/Limit/useLimitForm"
import { useAssets } from "@/providers/assetsProvider"

type Props = {
  readonly onSellAmountChange: () => void
  readonly onBuyAmountChange: () => void
  readonly onLockToggle: () => void
  readonly onAssetChange: (next: Partial<LimitFormValues>) => void
}

export const LimitFields: FC<Props> = ({
  onSellAmountChange,
  onBuyAmountChange,
  onLockToggle,
  onAssetChange,
}) => {
  const { t } = useTranslation(["common", "trade"])
  const { tradable } = useAssets()
  const navigate = useNavigate()

  const { getValues, setValue, watch } = useFormContext<LimitFormValues>()

  const [sellAmount, isLocked] = watch(["sellAmount", "isLocked"])

  const buyableAssets = tradable.filter(
    (asset) => !SELL_ONLY_ASSETS.includes(asset.id),
  )

  return (
    <Stack>
      <Box py="l" width="100%">
        <AssetSelectFormField<LimitFormValues>
          assetFieldName="sellAsset"
          amountFieldName="sellAmount"
          label={t("sell")}
          assets={tradable}
          onLockToggle={sellAmount ? onLockToggle : undefined}
          isLocked={isLocked}
          lockLabel={t("trade:limit.lockSell.aria")}
          onAssetChange={(sellAsset, previousSellAsset) => {
            const { buyAsset } = getValues()
            if (sellAsset.id === buyAsset?.id) {
              setValue("sellAsset", previousSellAsset)
              return
            }
            onAssetChange({ sellAsset })
            navigate({
              to: ".",
              search: (search) => ({
                ...search,
                assetIn: sellAsset.id,
                assetOut: buyAsset?.id,
              }),
              resetScroll: false,
            })
          }}
          onAmountChange={onSellAmountChange}
        />
      </Box>

      <LimitSwitcher />

      <Box py="l" width="100%">
        <AssetSelectFormField<LimitFormValues>
          assetFieldName="buyAsset"
          amountFieldName="buyAmount"
          label={t("buy")}
          assets={buyableAssets}
          balance={{ onMax: null }}
          onAssetChange={(buyAsset, previousBuyAsset) => {
            const { sellAsset } = getValues()
            if (buyAsset.id === sellAsset?.id) {
              setValue("buyAsset", previousBuyAsset)
              return
            }
            onAssetChange({ buyAsset })
            navigate({
              to: ".",
              search: (search) => ({
                ...search,
                assetIn: sellAsset?.id,
                assetOut: buyAsset.id,
              }),
              resetScroll: false,
            })
          }}
          onAmountChange={onBuyAmountChange}
        />
      </Box>
    </Stack>
  )
}
