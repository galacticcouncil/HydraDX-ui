import {
  Box,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { SELL_ONLY_ASSETS } from "@galacticcouncil/utils"
import { useNavigate } from "@tanstack/react-router"
import { FC, useEffect, useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { DcaAssetSwitcher } from "@/modules/trade/swap/sections/DCA/DcaAssetSwitcher"
import {
  DcaFormValues,
  DcaOrdersMode,
  DEFAULT_DCA_DURATION,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useSwitchAssets } from "@/modules/trade/swap/sections/DCA/useSwitchAssets"
import { TAsset, useAssets } from "@/providers/assetsProvider"
import {
  DEFAULT_TRADE_ASSET_IN_ID,
  DEFAULT_TRADE_ASSET_OUT_ID,
} from "@/routes/trade/_history/route"
import { useIsIceEnabled } from "@/states/intents"

type Props = {
  readonly maxBalance: string
}

export const DcaFields: FC<Props> = ({ maxBalance }) => {
  const { t } = useTranslation(["common", "trade"])
  const isIceEnabled = useIsIceEnabled()
  const { control, getValues, setValue, reset, trigger, watch } =
    useFormContext<DcaFormValues>()

  const isOpenBudget = watch("orders.type") === DcaOrdersMode.OpenBudget

  const { tradable, getAsset } = useAssets()
  const switchAssets = useSwitchAssets()

  const navigate = useNavigate()

  const buyableAssets = useMemo(
    () => tradable.filter((asset) => !SELL_ONLY_ASSETS.includes(asset.id)),
    [tradable],
  )

  useEffect(() => {
    if (!isIceEnabled) {
      setValue("limitEnabled", false)
    }
  }, [isIceEnabled, setValue])

  useEffect(() => {
    const { sellAsset, buyAsset, ...values } = getValues()

    if (!sellAsset || !buyAsset) {
      reset({
        ...values,
        sellAsset: getAsset(DEFAULT_TRADE_ASSET_IN_ID),
        buyAsset: getAsset(DEFAULT_TRADE_ASSET_OUT_ID),
      })

      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: DEFAULT_TRADE_ASSET_IN_ID,
          assetOut: DEFAULT_TRADE_ASSET_OUT_ID,
        }),
        resetScroll: false,
      })
    }
  }, [getValues, reset, getAsset, navigate])

  const handleSellAssetChange = (
    sellAsset: TAsset,
    previousSellAsset: TAsset | null,
  ): void => {
    const { buyAsset } = getValues()

    if (sellAsset.id !== buyAsset?.id) {
      reset({ ...getValues(), sellAsset, sellAmount: "" })

      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: sellAsset.id,
          assetOut: buyAsset?.id,
        }),
        resetScroll: false,
      })

      return
    }

    setValue("sellAsset", previousSellAsset)
    switchAssets.mutate()
  }

  const handleBuyAssetChange = (
    buyAsset: TAsset,
    previousBuyAsset: TAsset | null,
  ): void => {
    const { sellAsset } = getValues()

    if (buyAsset.id !== sellAsset?.id) {
      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: sellAsset?.id,
          assetOut: buyAsset.id,
        }),
        resetScroll: false,
      })

      return
    }

    setValue("buyAsset", previousBuyAsset)
    switchAssets.mutate()
  }

  return (
    <Box>
      <Controller
        control={control}
        name="orders"
        render={({ field }) => (
          <Box mt="m">
            <ToggleGroup
              type="single"
              fullWidth
              value={
                field.value.type === DcaOrdersMode.OpenBudget
                  ? DcaOrdersMode.OpenBudget
                  : DcaOrdersMode.Auto
              }
              onValueChange={(type) => {
                if (!type) return

                reset({
                  ...getValues(),
                  orders: {
                    ...(type === DcaOrdersMode.OpenBudget
                      ? { type, useSplitTrade: true }
                      : { type }),
                  },
                  duration: DEFAULT_DCA_DURATION,
                })

                trigger()
              }}
            >
              <ToggleGroupItem value={DcaOrdersMode.Auto}>
                {t("trade:trade.orders.limitedBudget")}
              </ToggleGroupItem>
              <ToggleGroupItem value={DcaOrdersMode.OpenBudget}>
                {t("trade:trade.orders.openBudget")}
              </ToggleGroupItem>
            </ToggleGroup>
          </Box>
        )}
      />
      <Box py="l" width="100%">
        <AssetSelectFormField<DcaFormValues>
          assetFieldName="sellAsset"
          amountFieldName="sellAmount"
          assets={tradable}
          label={
            isOpenBudget
              ? t("trade:dca.assetIn.title.open")
              : t("trade:dca.assetIn.title")
          }
          balance={{ value: maxBalance }}
          onAssetChange={handleSellAssetChange}
        />
      </Box>
      <DcaAssetSwitcher />
      <Controller
        control={control}
        name="buyAsset"
        render={({ field, fieldState }) => (
          <Box py="l" width="100%">
            <AssetSelect
              selectedAsset={field.value}
              setSelectedAsset={(buyAsset) => {
                field.onChange(buyAsset)
                handleBuyAssetChange(buyAsset, field.value)
              }}
              assets={buyableAssets}
              label={t("buy")}
              isAmountHidden
              balance={false}
              assetError={fieldState.error?.message}
            />
          </Box>
        )}
      />
    </Box>
  )
}
