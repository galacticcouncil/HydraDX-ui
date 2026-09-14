import {
  Box,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Separator,
} from "@galacticcouncil/ui/components"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { FC, useEffect, useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { CancelOtcOrderModalContent } from "@/modules/trade/otc/cancel-order/CancelOtcOrderModalContent"
import { AvailableAmount } from "@/modules/trade/otc/fill-order/AvailableAmount"
import {
  getOtcBuyAmountFromSellAmount,
  getOtcFeeAmount,
  getOtcSellAmountFromBuyAmount,
} from "@/modules/trade/otc/fill-order/FillOrder.utils"
import { useFillOrderForm } from "@/modules/trade/otc/fill-order/FillOrderModalContent.form"
import { useSubmitFillOrder } from "@/modules/trade/otc/fill-order/FillOrderModalContent.submit"
import { TokensConversion } from "@/modules/trade/otc/fill-order/TokensConversion"
import { OtcOfferTabular } from "@/modules/trade/otc/table/OtcTable.columns"
import { TradeFee } from "@/modules/trade/otc/TradeFee"
import { otcTradeFeeQuery } from "@/modules/trade/otc/TradeFee.query"
import { isBond } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

type Props = {
  readonly otcOffer: OtcOfferTabular
  readonly isUsersOffer: boolean
  readonly onClose: () => void
}

export const FillOrderModalContent: FC<Props> = ({
  otcOffer,
  isUsersOffer,
  onClose,
}) => {
  const rpc = useRpcProvider()
  const { t } = useTranslation(["trade", "common"])
  const [isSubmitCancelOpen, setIsSubmitCancelOpen] = useState(false)

  const { data: feePct = "0" } = useQuery(otcTradeFeeQuery(rpc))

  const { form, getMaxBalance } = useFillOrderForm(
    otcOffer,
    isUsersOffer,
    feePct,
  )
  const maxAccountBalance = getMaxBalance(otcOffer.assetIn)
  const assetInMax = Big.min(
    otcOffer.assetAmountIn,
    maxAccountBalance,
  ).toString()
  const submit = useSubmitFillOrder({
    otcOffer,
    onSubmitted: onClose,
  })

  const { trigger } = form
  useEffect(() => {
    if (!otcOffer.isPartiallyFillable) {
      trigger()
    }
  }, [otcOffer.isPartiallyFillable, trigger])

  const [sellAmount, buyAmount] = form.watch(["sellAmount", "buyAmount"])

  const feeAsset = otcOffer.assetOut
  const fee = getOtcFeeAmount(buyAmount, feePct)

  const feeAssetPriceId = isBond(feeAsset)
    ? feeAsset.underlyingAssetId
    : feeAsset.id

  const [feeDisplay] = useDisplayAssetPrice(feeAssetPriceId, fee || "0", {
    maximumFractionDigits: null,
  })

  const isSubmitEnabled =
    isUsersOffer || (!!sellAmount && form.formState.isValid)

  if (isSubmitCancelOpen) {
    return (
      <CancelOtcOrderModalContent
        otcOffer={otcOffer}
        onBack={() => setIsSubmitCancelOpen(false)}
        onClose={onClose}
      />
    )
  }

  return (
    <>
      <ModalHeader title={t("otc.fillOrder.title")} />
      <FormProvider {...form}>
        <form
          onSubmit={
            isUsersOffer
              ? (e) => {
                  e.preventDefault()
                  setIsSubmitCancelOpen(true)
                }
              : form.handleSubmit((values) => submit.mutate(values))
          }
        >
          <ModalBody sx={{ p: 0 }}>
            <AvailableAmount
              assetIn={otcOffer.assetIn}
              assetInAmount={otcOffer.assetAmountIn}
              isPartiallyFillable={otcOffer.isPartiallyFillable}
              userSellAmount={sellAmount}
            />
            <Separator />
            <Box px="xl">
              <Controller
                control={form.control}
                name="sellAmount"
                render={({ field, fieldState }) => (
                  <Box py="l" width="100%">
                    <AssetSelect
                      label={t("common:pay")}
                      value={field.value}
                      onChange={(sellAmount) => {
                        field.onChange(sellAmount)

                        if (!sellAmount) {
                          form.setValue("buyAmount", "", {
                            shouldValidate: true,
                          })

                          return
                        }

                        const newBuyAmount = getOtcBuyAmountFromSellAmount(
                          otcOffer,
                          sellAmount,
                          feePct,
                        )

                        form.setValue("buyAmount", newBuyAmount, {
                          shouldValidate: true,
                        })
                      }}
                      assets={[]}
                      selectedAsset={otcOffer.assetIn}
                      isDisabled={isUsersOffer || !otcOffer.isPartiallyFillable}
                      balance={{
                        value: maxAccountBalance,
                        max: assetInMax,
                        onMax: otcOffer.isPartiallyFillable ? undefined : null,
                      }}
                      amountError={fieldState.error?.message}
                    />
                  </Box>
                )}
              />
              <TokensConversion offer={otcOffer} />
              <Controller
                control={form.control}
                name="buyAmount"
                render={({ field, fieldState }) => (
                  <Box py="l" width="100%">
                    <AssetSelect
                      label={t("common:get")}
                      value={field.value}
                      onChange={(buyAmount) => {
                        field.onChange(buyAmount)

                        if (!buyAmount) {
                          form.setValue("sellAmount", "", {
                            shouldValidate: true,
                          })

                          return
                        }

                        const sellAmountBeforeFee =
                          getOtcSellAmountFromBuyAmount(
                            otcOffer,
                            buyAmount,
                            feePct,
                          )

                        form.setValue("sellAmount", sellAmountBeforeFee, {
                          shouldValidate: true,
                        })
                      }}
                      assets={[]}
                      selectedAsset={otcOffer.assetOut}
                      isDisabled={isUsersOffer || !otcOffer.isPartiallyFillable}
                      balance={{ onMax: null }}
                      amountError={fieldState.error?.message}
                    />
                  </Box>
                )}
              />
            </Box>
            <Separator />
            <TradeFee
              fee={fee}
              feeDisplay={feeDisplay}
              feePct={feePct}
              feeSymbol={feeAsset.symbol}
            />
            <Separator />
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              variant={isUsersOffer ? "danger" : "primary"}
              outline={isUsersOffer}
              size="large"
              width="100%"
              disabled={!isSubmitEnabled}
            >
              {isUsersOffer
                ? t("trade.cancelOrder.cta")
                : t("otc.fillOrder.cta")}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </>
  )
}
