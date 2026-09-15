import {
  Box,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { useSearch } from "@tanstack/react-router"
import { FC, useEffect, useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAccountBalances } from "@/api/balances"
import { DcaErrors } from "@/modules/trade/swap/sections/DCA/DcaErrors"
import { DcaFooter } from "@/modules/trade/swap/sections/DCA/DcaFooter"
import { DcaForm } from "@/modules/trade/swap/sections/DCA/DcaForm"
import { DcaHealthFactor } from "@/modules/trade/swap/sections/DCA/DcaHealthFactor"
import { DcaSummary } from "@/modules/trade/swap/sections/DCA/DcaSummary"
import { DcaWarnings } from "@/modules/trade/swap/sections/DCA/DcaWarnings"
import { useDcaTradeOrder } from "@/modules/trade/swap/sections/DCA/useDcaTradeOrder"
import {
  DcaValidationError,
  DcaValidationWarning,
  useDcaValidation,
  useOpenBudgetDcaHfValidation,
} from "@/modules/trade/swap/sections/DCA/useDcaValidation"
import { useMaxOrderBalance } from "@/modules/trade/swap/sections/DCA/useMaxOrderBalance"
import { useSubmitDcaOrder } from "@/modules/trade/swap/sections/DCA/useSubmitDcaOrder"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { maxBalanceError } from "@/utils/validators"

import { DcaOrdersMode, DEFAULT_DCA_DURATION, useDcaForm } from "./useDcaForm"

export const Dca: FC = () => {
  const { t } = useTranslation(["trade"])
  const { isBalanceLoading } = useAccountBalances()
  const { assetIn, assetOut } = useSearch({ from: "/trade/_history" })
  const { limitOrderMaxBalance, openBudgetOrderMaxBalance } =
    useMaxOrderBalance({
      assetIn,
      assetOut,
    })

  const form = useDcaForm({
    assetIn,
    assetOut,
    limitOrderMaxBalance,
    openBudgetOrderMaxBalance,
  })

  const {
    order,
    dryRunError,
    healthFactor: initialHealthFactor,
    isLoading,
  } = useDcaTradeOrder(form)

  const [duration, ordersType] = form.watch(["duration", "orders.type"])
  const { warnings, errors } = useDcaValidation(order, duration)

  const isOpenBudget = ordersType === DcaOrdersMode.OpenBudget
  const openBudgetHealthFactor = useOpenBudgetDcaHfValidation(
    order,
    initialHealthFactor,
    isOpenBudget,
  )

  const healthFactor = isOpenBudget
    ? openBudgetHealthFactor
    : initialHealthFactor

  const submitDcaOrder = useSubmitDcaOrder()

  const [priceImpactLossAccepted, setPriceImpactLossAccepted] = useState(false)
  const [healthFactorRiskAccepted, setHealthFactorRiskAccepted] =
    useState(false)

  const { watch } = form
  useEffect(() => {
    const subscription = watch((_, { type }) => {
      if (type !== "change") {
        return
      }

      setPriceImpactLossAccepted(false)
      setHealthFactorRiskAccepted(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch])

  const isFormValid = !!order && form.formState.isValid && !errors.length

  const isPriceImpactCheckSatisfied =
    !warnings.includes(DcaValidationWarning.PriceImpact) ||
    priceImpactLossAccepted

  const isHealthFactorCheckSatisfied =
    healthFactor?.isUserConsentRequired &&
    healthFactor.isSignificantChange &&
    healthFactor.future < healthFactor.current
      ? healthFactorRiskAccepted
      : true

  const isSubmitEnabled =
    isFormValid &&
    isPriceImpactCheckSatisfied &&
    isHealthFactorCheckSatisfied &&
    !isBalanceLoading

  const isHealthFactorShown =
    form.formState.errors.sellAmount?.message !== maxBalanceError

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submitDcaOrder.mutate(values))}
      >
        <Controller
          control={form.control}
          name="orders"
          render={({ field }) => (
            <Box mt="m">
              <ToggleGroup
                type="single"
                value={
                  field.value.type === DcaOrdersMode.OpenBudget
                    ? DcaOrdersMode.OpenBudget
                    : DcaOrdersMode.Auto
                }
                onValueChange={(type) => {
                  if (!type) return

                  form.reset({
                    ...form.getValues(),
                    orders: {
                      ...(type === DcaOrdersMode.OpenBudget
                        ? { type, useSplitTrade: true }
                        : { type }),
                    },
                    duration: DEFAULT_DCA_DURATION,
                  })

                  form.trigger()
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
        <DcaForm
          maxBalance={
            isOpenBudget ? openBudgetOrderMaxBalance : limitOrderMaxBalance
          }
        />
        <DcaSummary
          order={order}
          priceImpactLevel={
            errors.includes(DcaValidationError.PriceImpact)
              ? "error"
              : warnings.includes(DcaValidationWarning.PriceImpact)
                ? "warning"
                : undefined
          }
          isLoading={isLoading}
        />
        <DcaErrors
          priceImpact={order?.tradeImpactPct ?? 0}
          errors={errors}
          dryRunError={dryRunError}
        />
        <DcaWarnings
          isFormValid={isFormValid}
          order={order}
          isOpenBudget={isOpenBudget}
          warnings={warnings}
          healthFactor={healthFactor}
          priceImpactLossAccepted={priceImpactLossAccepted}
          healthFactorRiskAccepted={healthFactorRiskAccepted}
          onPriceImpactLossAcceptedChange={setPriceImpactLossAccepted}
          onHealthFactorRiskAcceptedChange={setHealthFactorRiskAccepted}
        />
        <DcaHealthFactor
          order={order}
          healthFactor={isHealthFactorShown ? healthFactor : undefined}
          isLoading={isLoading}
        />
        <SwapSectionSeparator />
        <DcaFooter
          isEnabled={isSubmitEnabled}
          isLoading={submitDcaOrder.isPending}
          isOpenBudget={isOpenBudget}
        />
      </form>
    </FormProvider>
  )
}
