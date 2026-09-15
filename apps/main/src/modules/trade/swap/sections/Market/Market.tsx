import { Box } from "@galacticcouncil/ui/components"
import { useSearch } from "@tanstack/react-router"
import { FC, useEffect, useState } from "react"
import { FormProvider } from "react-hook-form"

import { useAccountBalances } from "@/api/balances"
import { TradeType } from "@/api/trade"
import { isTwapEnabled } from "@/modules/trade/swap/sections/Market/lib/isTwapEnabled"
import { useMarketForm } from "@/modules/trade/swap/sections/Market/lib/useMarketForm"
import { useMaxSellAmount } from "@/modules/trade/swap/sections/Market/lib/useMaxSellAmount"
import { useSubmitSwap } from "@/modules/trade/swap/sections/Market/lib/useSubmitSwap"
import { useSubmitTwap } from "@/modules/trade/swap/sections/Market/lib/useSubmitTwap"
import { useMarketBuyData } from "@/modules/trade/swap/sections/Market/Market.BuyData"
import { useMarketSellData } from "@/modules/trade/swap/sections/Market/Market.SellData"
import { MarketErrors } from "@/modules/trade/swap/sections/Market/MarketErrors"
import { MarketFields } from "@/modules/trade/swap/sections/Market/MarketFields"
import { MarketSubmit } from "@/modules/trade/swap/sections/Market/MarketSubmit"
import { MarketTradeOptions } from "@/modules/trade/swap/sections/Market/MarketTradeOptions"
import { MarketWarnings } from "@/modules/trade/swap/sections/Market/MarketWarnings"
import { MarketSummary } from "@/modules/trade/swap/sections/Market/Summary/MarketSummary"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { maxBalanceError } from "@/utils/validators"

export const Market: FC = () => {
  const { assetIn, assetOut } = useSearch({ from: "/trade/_history" })
  const { isBalanceLoading } = useAccountBalances()

  const submitSwap = useSubmitSwap()
  const submitTwap = useSubmitTwap()

  const {
    maxSwapSellBalance,
    maxTwapSellBalance,
    isMaxSwapSellBalanceLoading,
    isMaxTwapSellBalanceLoading,
  } = useMaxSellAmount({
    assetIn,
    assetOut,
  })

  const form = useMarketForm({
    assetIn,
    assetOut,
    maxSwapSellBalance,
    maxTwapSellBalance,
  })
  const [type, isSingleTrade] = form.watch(["type", "isSingleTrade"])

  const [healthFactorRiskAccepted, setHealthFactorRiskAccepted] =
    useState(false)

  const { watch, setValue } = form
  useEffect(() => {
    const subscription = watch((_, { type }) => {
      if (type !== "change") {
        return
      }

      setHealthFactorRiskAccepted(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch])

  const isSell = type === TradeType.Sell

  // We need to preserve component state and focus on changing market type
  const useMarketData = isSell ? useMarketSellData : useMarketBuyData

  const {
    swap,
    twap,
    healthFactor,
    isSwapLoading,
    isTwapLoading,
    isHealthFactorLoading,
  } = useMarketData(form)

  // Revert to single trade if scheduler cannot split the order
  useEffect(() => {
    if (swap && !isTwapEnabled(swap)) {
      setValue("isSingleTrade", true, { shouldValidate: true })
    }
  }, [swap, setValue])

  const isTradeEnabled = isSingleTrade
    ? !!swap && !swap.swaps.flatMap((swap) => swap.errors).length
    : !!twap && !twap?.errors.length

  const isHealthFactorCheckSatisfied =
    healthFactor?.isUserConsentRequired &&
    healthFactor.future < healthFactor.current
      ? healthFactorRiskAccepted
      : true

  const isExpanded = isSwapLoading || (isSingleTrade ? !!swap : !!twap)

  const isFormValid = isTradeEnabled && form.formState.isValid
  const isSubmitEnabled =
    isFormValid && isHealthFactorCheckSatisfied && !isBalanceLoading

  const isHealthFactorShown =
    form.formState.errors.sellAmount?.message !== maxBalanceError

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          isSingleTrade
            ? swap && submitSwap.mutate(values)
            : twap && submitTwap.mutate(values),
        )}
      >
        <MarketFields
          swap={swap}
          twap={twap}
          maxSellBalance={
            isSingleTrade ? maxSwapSellBalance : maxTwapSellBalance
          }
          maxSellBalanceLoading={
            isSingleTrade
              ? isMaxSwapSellBalanceLoading
              : isMaxTwapSellBalanceLoading
          }
        />
        {isExpanded && (
          <Box pt="base" pb="m">
            <MarketTradeOptions
              swap={swap}
              twap={twap}
              isSwapLoading={isSwapLoading}
              isTwapLoading={isTwapLoading}
            />
            <MarketWarnings
              swap={swap}
              isFormValid={isFormValid}
              isSingleTrade={isSingleTrade}
              twap={twap}
              healthFactor={healthFactor}
              healthFactorRiskAccepted={healthFactorRiskAccepted}
              setHealthFactorRiskAccepted={setHealthFactorRiskAccepted}
            />
            {swap && <MarketErrors swap={swap} />}
          </Box>
        )}
        <SwapSectionSeparator />
        <MarketSubmit
          isSingleTrade={isSingleTrade}
          isLoading={
            isSingleTrade
              ? isSwapLoading || submitSwap.isPending
              : isTwapLoading || submitTwap.isPending
          }
          isEnabled={isSubmitEnabled}
        />
        <MarketSummary
          swapType={type}
          swap={swap}
          twap={twap}
          healthFactor={isHealthFactorShown ? healthFactor : undefined}
          isLoading={
            isHealthFactorLoading ||
            (isSingleTrade ? isSwapLoading : isTwapLoading)
          }
        />
      </form>
    </FormProvider>
  )
}
