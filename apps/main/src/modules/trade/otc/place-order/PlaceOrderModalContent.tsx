import {
  Box,
  Button,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Separator,
} from "@galacticcouncil/ui/components"
import { formatAssetAmount, formatNumber } from "@galacticcouncil/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Big from "big.js"
import { FC, useCallback, useEffect, useMemo, useRef } from "react"
import { FormProvider, useController } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { spotPriceQuery } from "@/api/spotPrice"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { PartiallyFillableToggle } from "@/modules/trade/otc/place-order/PartiallyFillableToggle"
import {
  PlaceOrderFormValues,
  PriceSettings,
  usePlaceOrder,
} from "@/modules/trade/otc/place-order/PlaceOrderModalContent.form"
import { useSubmitPlaceOrder } from "@/modules/trade/otc/place-order/PlaceOrderModalContent.submit"
import {
  getOmnipoolPrice,
  getPrice,
} from "@/modules/trade/otc/place-order/PlaceOrderModalContent.utils"
import { PlaceOrderPrice } from "@/modules/trade/otc/place-order/PlaceOrderPrice"
import { PRICE_GAIN_DIFF_THRESHOLD } from "@/modules/trade/otc/place-order/PlaceOrderPriceButtons"
import { PriceGainWarning } from "@/modules/trade/otc/place-order/PriceGainWarning"
import { TAsset, useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

type Props = {
  readonly onClose: () => void
}

const getNewBuyAmount = (
  newOfferAmount: string,
  isOfferView: boolean,
  offerPrice: string,
  buyPrice: string,
  buyAsset: TAsset,
) => {
  const newBuyAmount = (() => {
    if (isOfferView) {
      return Big(newOfferAmount).mul(offerPrice)
    } else if (Big(buyPrice).gt(0)) {
      return Big(newOfferAmount).div(buyPrice)
    }
  })()

  if (!newBuyAmount || !newBuyAmount.gt(0)) {
    return
  }

  return formatAssetAmount(newBuyAmount.toString(), buyAsset.decimals)
}

const getNewOfferAmount = (
  newBuyAmount: string,
  isOfferView: boolean,
  offerPrice: string,
  buyPrice: string,
  offerAsset: TAsset,
) => {
  const newOfferAmount = (() => {
    if (isOfferView) {
      return Big(newBuyAmount).div(offerPrice)
    } else if (Big(buyPrice).gt(0)) {
      return Big(newBuyAmount).mul(buyPrice)
    }
  })()

  if (!newOfferAmount || !newOfferAmount.gt(0)) {
    return
  }

  return formatAssetAmount(newOfferAmount.toString(), offerAsset.decimals)
}

export const PlaceOrderModalContent: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation(["trade", "common"])
  const rpc = useRpcProvider()
  const queryClient = useQueryClient()

  const { all } = useAssets()

  const { form, getMaxBalance } = usePlaceOrder()
  const { getValues, setValue, watch, control } = form

  const [offerAsset, offerAmount, buyAsset, buyAmount, priceSettings, view] =
    watch([
      "offerAsset",
      "offerAmount",
      "buyAsset",
      "buyAmount",
      "priceSettings",
      "view",
    ])

  const sufficientAssets = useMemo(
    () => Array.from(all.values()).filter((asset) => asset.isSufficient),
    [all],
  )

  const { field: priceConfirmationField } = useController({
    control,
    name: "priceConfirmation",
  })

  const { data: spotPrice, isLoading: priceLoading } = useQuery(
    spotPriceQuery(rpc, offerAsset?.id ?? "", buyAsset?.id ?? ""),
  )

  const [omnipoolPrice, { isPriceValid }] = getOmnipoolPrice(
    spotPrice?.spotPrice,
  )
  const { offerPrice, buyPrice, priceGain } = getPrice(
    priceSettings,
    omnipoolPrice,
    buyAsset?.decimals ?? 0,
  )

  const isOfferView = view === "offerPrice"

  const submit = useSubmitPlaceOrder({ onSubmitted: onClose })
  const lastTouchedAssetRef = useRef<"offer" | "buy">("offer")

  const handleOfferAmountChange = (newOfferAmount: string): void => {
    lastTouchedAssetRef.current = "offer"

    if (!newOfferAmount) {
      form.setValue("buyAmount", "", { shouldValidate: true })

      return
    }

    if (!buyAsset) {
      return
    }

    const newBuyAmount = getNewBuyAmount(
      newOfferAmount,
      isOfferView,
      offerPrice,
      buyPrice,
      buyAsset,
    )

    if (newBuyAmount) {
      form.setValue("buyAmount", newBuyAmount, {
        shouldValidate: true,
      })
    }
  }

  const handleBuyAmountChange = (newBuyAmount: string): void => {
    lastTouchedAssetRef.current = "buy"

    if (!newBuyAmount) {
      form.setValue("offerAmount", "", { shouldValidate: true })

      return
    }

    if (!offerAsset) {
      return
    }

    const newOfferAmount = getNewOfferAmount(
      newBuyAmount,
      isOfferView,
      offerPrice,
      buyPrice,
      offerAsset,
    )

    if (!newOfferAmount) {
      return
    }

    form.setValue("offerAmount", newOfferAmount, {
      shouldValidate: true,
    })
  }

  const handlePriceUpdate = useCallback(
    (formValues: PlaceOrderFormValues, omnipoolPrice: string): void => {
      const {
        offerAsset,
        offerAmount,
        buyAsset,
        buyAmount,
        priceSettings,
        priceConfirmation,
        view,
      } = formValues

      if (!offerAsset || !buyAsset) {
        return
      }

      const isOfferView = view === "offerPrice"

      const { offerPrice, buyPrice, priceGain } = getPrice(
        priceSettings,
        omnipoolPrice,
        buyAsset.decimals,
      )

      const offerPriceBig = Big(offerPrice)
      const priceGainBig = Big(priceGain)

      if (!buyAmount || lastTouchedAssetRef.current === "offer") {
        const newBuyAmount = getNewBuyAmount(
          offerAmount || "0",
          isOfferView,
          offerPrice,
          buyPrice,
          buyAsset,
        )

        if (newBuyAmount) {
          setValue("buyAmount", newBuyAmount, {
            shouldValidate: true,
          })
        }
      } else if (!offerAmount || lastTouchedAssetRef.current === "buy") {
        const newOfferAmount = getNewOfferAmount(
          buyAmount || "0",
          isOfferView,
          offerPrice,
          buyPrice,
          offerAsset,
        )

        if (newOfferAmount) {
          setValue("offerAmount", newOfferAmount, {
            shouldValidate: true,
          })
        }
      }

      const priceNeedsConfirmation =
        !offerPriceBig.eq(0) && priceGainBig.lte(-PRICE_GAIN_DIFF_THRESHOLD)

      const priceConfirmationNew = (() => {
        if (priceNeedsConfirmation) {
          if (priceConfirmation) {
            return priceConfirmation
          } else {
            return { confirmed: false }
          }
        }

        return null
      })()

      setValue("priceConfirmation", priceConfirmationNew)
    },
    [setValue],
  )

  const handlePriceSettingsChange = (priceSettings: PriceSettings): void => {
    if (!offerAsset || !buyAsset) {
      return
    }

    const spotPrice = queryClient.getQueryData(
      spotPriceQuery(rpc, offerAsset.id, buyAsset.id).queryKey,
    )
    const [omnipoolPrice, { isPriceValid }] = getOmnipoolPrice(
      spotPrice?.spotPrice,
    )

    if (priceSettings.type === "fixed" || isPriceValid) {
      const formValues = getValues()
      handlePriceUpdate(formValues, omnipoolPrice)
    }
  }

  const switchAssets = (): void => {
    const formValues = form.getValues()

    form.reset({
      ...formValues,
      offerAsset: formValues.buyAsset,
      offerAmount: "1",
      buyAsset: formValues.offerAsset,
      buyAmount: "",
      priceSettings: {
        type: "relative",
        percentage: 0,
      },
      priceConfirmation: null,
      view: "offerPrice",
    })

    form.trigger()
  }

  const handleOfferAssetChange = (
    newOfferAsset: TAsset,
    previousOfferAsset: TAsset | null,
  ): void => {
    const formValues = form.getValues()

    if (!previousOfferAsset || !formValues.buyAsset) {
      return
    }

    lastTouchedAssetRef.current = "offer"

    const isSwitch = newOfferAsset.id === formValues.buyAsset.id

    if (isSwitch) {
      form.setValue("offerAsset", previousOfferAsset)
      switchAssets()
      return
    }

    form.reset({
      ...formValues,
      offerAsset: newOfferAsset,
      offerAmount: "1",
      buyAmount: "",
      priceSettings: { type: "relative", percentage: 0 },
      priceConfirmation: null,
      view: "offerPrice",
    })

    form.trigger()
  }

  const handleBuyAssetChange = (
    newBuyAsset: TAsset,
    previousBuyAsset: TAsset | null,
  ): void => {
    const formValues = form.getValues()

    if (!formValues.offerAsset || !previousBuyAsset) {
      return
    }

    lastTouchedAssetRef.current = "offer"

    const isSwitch = newBuyAsset.id === formValues.offerAsset.id

    if (isSwitch) {
      form.setValue("buyAsset", previousBuyAsset)
      switchAssets()
      return
    }

    form.reset({
      ...formValues,
      offerAmount: "1",
      buyAsset: newBuyAsset,
      buyAmount: "",
      priceSettings: { type: "relative", percentage: 0 },
      priceConfirmation: null,
      view: "offerPrice",
    })

    form.trigger()
  }

  useEffect(() => {
    if (isPriceValid) {
      const formValues = getValues()
      handlePriceUpdate(formValues, omnipoolPrice)
    }
  }, [omnipoolPrice, isPriceValid, getValues, handlePriceUpdate])

  const areAssetsSelected = !!offerAsset && !!buyAsset

  const inputPrice = view === "offerPrice" ? offerPrice : buyPrice
  const inputPriceFormatted =
    priceSettings.type === "fixed" && priceSettings.view === view
      ? inputPrice
      : // the value needs to be formatted for display if it was calculated
        formatNumber(inputPrice, undefined, { useGrouping: false })

  const isSubmitEnabled =
    !!offerAmount &&
    !!buyAmount &&
    form.formState.isValid &&
    (!priceConfirmationField.value || priceConfirmationField.value.confirmed)

  return (
    <>
      <ModalHeader
        title={t("otc.placeOrder.title")}
        description={t("otc.placeOrder.description")}
      />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((value) => submit.mutate(value))}>
          <ModalBody sx={{ p: 0 }}>
            <Box px="xl">
              <Box py="l" width="100%">
                <AssetSelectFormField<PlaceOrderFormValues>
                  assetFieldName="offerAsset"
                  amountFieldName="offerAmount"
                  label={t("common:offer")}
                  assets={sufficientAssets}
                  balance={
                    areAssetsSelected
                      ? { value: getMaxBalance(offerAsset) }
                      : false
                  }
                  displayValue={areAssetsSelected ? undefined : null}
                  isReadOnly={!areAssetsSelected}
                  onAmountChange={handleOfferAmountChange}
                  onAssetChange={handleOfferAssetChange}
                />
              </Box>
              <ModalContentDivider />
              {offerAsset && buyAsset && (
                <>
                  <PlaceOrderPrice
                    offerAsset={offerAsset}
                    buyAsset={buyAsset}
                    price={inputPriceFormatted}
                    priceGain={priceGain}
                    isPriceLoaded={!priceLoading && isPriceValid}
                    onChange={handlePriceSettingsChange}
                  />
                  <ModalContentDivider />
                </>
              )}
              <Box py="l" width="100%">
                <AssetSelectFormField<PlaceOrderFormValues>
                  assetFieldName="buyAsset"
                  amountFieldName="buyAmount"
                  label={t("otc.placeOrder.buy")}
                  assets={sufficientAssets}
                  balance={{ onMax: null }}
                  displayValue={areAssetsSelected ? undefined : null}
                  isReadOnly={!areAssetsSelected}
                  onAmountChange={handleBuyAmountChange}
                  onAssetChange={handleBuyAssetChange}
                />
              </Box>
            </Box>
            {areAssetsSelected && (
              <>
                <Separator />
                <PartiallyFillableToggle />
                <Separator />
                {offerAsset && buyAsset && (
                  <>
                    <PriceGainWarning
                      offerAsset={offerAsset}
                      buyAsset={buyAsset}
                      priceGain={priceGain}
                      view={view}
                    />
                    <Separator />
                  </>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              size="large"
              width="100%"
              disabled={!isSubmitEnabled}
            >
              {t("otc.placeOrder.cta")}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </>
  )
}
