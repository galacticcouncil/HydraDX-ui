import { HealthFactorRiskWarning } from "@galacticcouncil/money-market/components"
import { Button, Text } from "@galacticcouncil/ui/components"
import { useWeb3ConnectModal, WalletMode } from "@galacticcouncil/web3-connect"
import { useSearch } from "@tanstack/react-router"
import Big from "big.js"
import { useEffect, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TradeType } from "@/api/trade"
import { TradeFormShell } from "@/modules/trade/swap/components/TradeFormShell/TradeFormShell"
import { TradeFormSubmit } from "@/modules/trade/swap/components/TradeFormSubmit"
import { useXcSwapAlerts } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapAlerts"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { isTwapEnabled } from "@/modules/trade/swap/sections/XcSwap/lib/isTwapEnabled"
import { isXcSwapTradeEnabled } from "@/modules/trade/swap/sections/XcSwap/lib/isXcSwapTradeEnabled"
import { XcSwapAlerts } from "@/modules/trade/swap/sections/XcSwap/XcSwapAlerts"
import { XcSwapFields } from "@/modules/trade/swap/sections/XcSwap/XcSwapFields"
import { XcSwapOptions } from "@/modules/trade/swap/sections/XcSwap/XcSwapOptions"
import {
  useXcSwap,
  XcSwapProvider,
} from "@/modules/trade/swap/sections/XcSwap/XcSwapProvider"
import { XcSwapSummary } from "@/modules/trade/swap/sections/XcSwap/XcSwapSummary"

export const XcSwap: React.FC = () => {
  const { assetIn, assetOut } = useSearch({ from: "/trade/_history" })

  return (
    <XcSwapProvider assetIn={assetIn} assetOut={assetOut}>
      <XcSwapForm />
    </XcSwapProvider>
  )
}

const XcSwapForm: React.FC = () => {
  const {
    destChainAssetPairs,
    onSubmit,
    quote,
    isQuoteLoading,
    isTwapLoading,
    isQuoteRefreshing,
    isLoading,
    isCrossChain,
    healthFactor,
    requiredWalletMode,
    isWalletCompatible,
  } = useXcSwap()
  const { hasBlockingAlerts } = useXcSwapAlerts()
  const form = useFormContext<XcSwapFormValues>()
  const { t } = useTranslation(["common", "trade"])
  const { toggle } = useWeb3ConnectModal()
  const isWalletConnectRequired = !!requiredWalletMode && !isWalletCompatible

  const [destAddress, isSingleTrade] = form.watch([
    "destAddress",
    "isSingleTrade",
  ])

  const [healthFactorRiskAccepted, setHealthFactorRiskAccepted] =
    useState(false)

  const { watch, setValue } = form

  const onChainSwap = quote?.kind === "oc" ? quote.swap : undefined
  useEffect(() => {
    if (onChainSwap && !isTwapEnabled(onChainSwap)) {
      setValue("isSingleTrade", true, { shouldValidate: true })
    }
  }, [onChainSwap, setValue])

  useEffect(() => {
    const subscription = watch((values, { type, name }) => {
      if (type !== "change") {
        return
      }

      const quoteDerivedField =
        values.type === TradeType.Sell ? "buyAmount" : "sellAmount"
      const shouldReset = name !== undefined && name !== quoteDerivedField

      if (!shouldReset) {
        return
      }

      setHealthFactorRiskAccepted(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch])

  const isHealthFactorConsentRequired =
    !isCrossChain &&
    !!healthFactor &&
    healthFactor.isUserConsentRequired &&
    healthFactor.future < healthFactor.current

  const isTradeReady =
    form.formState.isValid &&
    !hasBlockingAlerts &&
    isXcSwapTradeEnabled(quote, isSingleTrade)

  const isFormValid = isTradeReady && !isQuoteLoading && !isQuoteRefreshing

  const isHealthFactorCheckSatisfied = isHealthFactorConsentRequired
    ? healthFactorRiskAccepted
    : true

  const canSubmit = isFormValid && isHealthFactorCheckSatisfied

  const shouldRenderHealthFactorWarning =
    isHealthFactorConsentRequired && Big(healthFactor.future).gt(1)

  const isSubmitLoading =
    isLoading ||
    isQuoteRefreshing ||
    (isSingleTrade ? isQuoteLoading : isTwapLoading)

  const disabledLabel = (() => {
    if (isCrossChain && !destAddress.trim())
      return t("trade:xc.swap.cta.enterRecipient")
    if (!isFormValid) return undefined
    if (!isHealthFactorCheckSatisfied)
      return t("trade:xc.swap.cta.acceptHealthFactor")
    return undefined
  })()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <TradeFormShell
        fields={<XcSwapFields destChainAssetPairs={destChainAssetPairs} />}
        summary={<XcSwapSummary />}
        submit={
          isWalletConnectRequired ? (
            <Button
              size="large"
              variant="secondary"
              width="100%"
              onClick={() => toggle(requiredWalletMode)}
            >
              <Text fs="p3">
                {requiredWalletMode === WalletMode.EVM
                  ? t("connectWallet.evm")
                  : t("connectWallet")}
              </Text>
            </Button>
          ) : (
            <TradeFormSubmit
              isEnabled={canSubmit}
              isLoading={isSubmitLoading}
              disabledLabel={disabledLabel}
            >
              {isSingleTrade ? t("swap") : t("trade:market.twap.cta")}
            </TradeFormSubmit>
          )
        }
      >
        <XcSwapOptions />
        <XcSwapAlerts />
        {healthFactor && shouldRenderHealthFactorWarning && (
          <HealthFactorRiskWarning
            canContinue={isTradeReady}
            message={t("healthFactor.warning")}
            accepted={healthFactorRiskAccepted}
            isUserConsentRequired={healthFactor.isUserConsentRequired}
            onAcceptedChange={setHealthFactorRiskAccepted}
          />
        )}
      </TradeFormShell>
    </form>
  )
}
