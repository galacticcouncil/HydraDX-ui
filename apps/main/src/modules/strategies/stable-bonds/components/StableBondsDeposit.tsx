import { Lock } from "@galacticcouncil/ui/assets/icons"
import {
  AssetInput,
  Box,
  CollapsibleContent,
  CollapsibleRoot,
  Flex,
  Icon,
  LoadingButton,
  Paper,
  Separator,
  Summary,
  SummaryRow,
  Text,
} from "@galacticcouncil/ui/components"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { millisecondsInDay } from "date-fns/constants"
import { useMemo } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useBondData } from "@/api/bonds"
import { AssetLogo } from "@/components/AssetLogo"
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  type StableBondsFormValues,
  useStableBondsForm,
} from "@/modules/strategies/stable-bonds/components/StableBondsDeposit.form"
import { StableBondsExchangeRate } from "@/modules/strategies/stable-bonds/components/StableBondsExchangeRate"
import { StableBondsSoldOut } from "@/modules/strategies/stable-bonds/components/StableBondsSoldOut"
import { useStableBondsConfig } from "@/modules/strategies/stable-bonds/context/StableBondsConfigContext"
import { useSubmitStableBondsOrder } from "@/modules/strategies/stable-bonds/hooks/useSubmitStableBondsOrder"
import {
  getOtcBuyAmountFromSellAmount,
  getOtcFeeAmount,
} from "@/modules/trade/otc/fill-order/FillOrder.utils"
import { OtcOffer } from "@/modules/trade/otc/table/OtcTable.query"
import { otcTradeFeeQuery } from "@/modules/trade/otc/TradeFee.query"
import { isBond, useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

export type StableBondsDepositProps = {
  orders: OtcOffer[]
}

export const StableBondsDeposit: React.FC<StableBondsDepositProps> = ({
  orders,
}) => {
  const { t } = useTranslation(["common", "trade", "strategies"])
  const rpc = useRpcProvider()
  const submit = useSubmitStableBondsOrder()
  const { getAssetWithFallback } = useAssets()
  const config = useStableBondsConfig()
  const { timeLeft } = useBondData(config.bondId)

  const { data: feePct = "0", isPending: isFeePending } = useQuery(
    otcTradeFeeQuery(rpc),
  )
  const { form, getMaxBalance } = useStableBondsForm(orders)

  const depositAssets = useMemo(() => {
    return [
      ...new Map(
        orders
          .filter((order) => Big(order.assetAmountIn).gt(0))
          .map((order) => [order.assetIn.id, order.assetIn]),
      ).values(),
    ]
  }, [orders])

  const { handleSubmit, watch } = form
  const [depositAsset, depositAmount] = watch(["depositAsset", "depositAmount"])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.assetIn.id === depositAsset?.id),
    [depositAsset?.id, orders],
  )

  const isSelectedOrderFillable =
    !!selectedOrder?.id && Big(selectedOrder.assetAmountIn).gt(0)

  const receiveAsset = selectedOrder?.assetOut ?? null

  const underlyingAssetId =
    receiveAsset && isBond(receiveAsset) ? receiveAsset.underlyingAssetId : ""
  const underlyingAsset = getAssetWithFallback(underlyingAssetId)

  const depositAssetBalance = selectedOrder ? getMaxBalance(depositAsset) : "0"

  const assetInMax = selectedOrder
    ? Big.min(selectedOrder.assetAmountIn, depositAssetBalance).toString()
    : "0"

  const receiveAmount = getOtcBuyAmountFromSellAmount(
    selectedOrder,
    depositAmount,
    feePct,
  )

  const feeAmount = getOtcFeeAmount(receiveAmount, feePct)

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(
          (values) =>
            isSelectedOrderFillable &&
            selectedOrder &&
            submit.mutate({ values, order: selectedOrder, receiveAmount }),
        )}
      >
        <Paper px="xl" position="relative">
          <Box>
            <Box py="l" width="100%">
              <AssetSelectFormField<StableBondsFormValues>
                label={t("strategies:bonds.deposit.yourDeposit")}
                assetFieldName="depositAsset"
                amountFieldName="depositAmount"
                assets={depositAssets}
                isDisabled={!isSelectedOrderFillable}
                balance={{ value: depositAssetBalance, max: assetInMax }}
              />
            </Box>

            <StableBondsExchangeRate order={selectedOrder} />

            <Box py="l" width="100%">
              <AssetInput
                label={t("strategies:bonds.deposit.receiveAtMaturity")}
                asset={{
                  symbol: underlyingAsset.symbol,
                  icon: <AssetLogo id={underlyingAsset.id} size="medium" />,
                }}
                isReadOnly
                value={receiveAmount}
                displayValue={t("currency", {
                  value: receiveAmount,
                })}
              />
            </Box>
          </Box>

          <Separator mx="-xl" />

          {timeLeft > 0 && (
            <>
              <SummaryRow
                label={
                  <Flex align="center" gap="base">
                    <Icon component={Lock} size="xs" />
                    <Text fs="p5">
                      {t("strategies:bonds.deposit.maturityPeriod")}
                    </Text>
                  </Flex>
                }
                content={t("interval.remaining", {
                  value: timeLeft,
                  largest: 1,
                  ...(timeLeft > millisecondsInDay && { unit: "d" }),
                })}
              />

              <Separator mx="-xl" />
            </>
          )}

          <Box py="xl">
            <AuthorizedAction size="large" width="100%">
              <LoadingButton
                isLoading={submit.isPending}
                type="submit"
                size="large"
                width="100%"
                disabled={
                  !form.formState.isValid ||
                  !isSelectedOrderFillable ||
                  isFeePending ||
                  submit.isPending
                }
              >
                {t("confirm")}
              </LoadingButton>
            </AuthorizedAction>
          </Box>

          <CollapsibleRoot open={Big(feeAmount || "0").gt(0)}>
            <CollapsibleContent>
              <Separator mx="-xl" />
              <Summary>
                <SummaryRow
                  label={t("trade:otc.fillOrder.tradeFee", {
                    percentage: Big(feePct).times(100).toNumber(),
                  })}
                  content={t("currency", {
                    value: feeAmount,
                    symbol: selectedOrder?.assetOut.symbol,
                  })}
                />
              </Summary>
            </CollapsibleContent>
          </CollapsibleRoot>
          {!isSelectedOrderFillable && <StableBondsSoldOut />}
        </Paper>
      </form>
    </FormProvider>
  )
}
