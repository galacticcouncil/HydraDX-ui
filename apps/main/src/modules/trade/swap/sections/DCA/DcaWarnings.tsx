import { HealthFactorRiskWarning } from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { TradeDcaOrder } from "@galacticcouncil/sdk-next/sor"
import { Alert, Flex } from "@galacticcouncil/ui/components"
import Big from "big.js"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { DcaPriceImpactWarning } from "@/modules/trade/swap/sections/DCA/DcaPriceImpactWarning"
import { DcaValidationWarning } from "@/modules/trade/swap/sections/DCA/useDcaValidation"

type Props = {
  readonly isFormValid: boolean
  readonly order: TradeDcaOrder | undefined | null
  readonly isOpenBudget: boolean
  readonly warnings: ReadonlyArray<DcaValidationWarning>
  readonly healthFactor: HealthFactorResult | undefined
  readonly priceImpactLossAccepted: boolean
  readonly healthFactorRiskAccepted: boolean
  readonly onPriceImpactLossAcceptedChange: (accepted: boolean) => void
  readonly onHealthFactorRiskAcceptedChange: (accepted: boolean) => void
}

export const DcaWarnings: FC<Props> = ({
  isFormValid,
  order,
  isOpenBudget,
  warnings,
  healthFactor,
  priceImpactLossAccepted,
  healthFactorRiskAccepted,
  onPriceImpactLossAcceptedChange,
  onHealthFactorRiskAcceptedChange,
}) => {
  const { t } = useTranslation(["common", "trade"])

  const shouldRenderHealthFactorWarning =
    isFormValid &&
    !!order &&
    !!healthFactor &&
    Big(healthFactor.future).gt(1) &&
    healthFactor.future < healthFactor.current &&
    healthFactor.isUserConsentRequired &&
    healthFactor.isSignificantChange

  if (!warnings.length && !shouldRenderHealthFactorWarning) {
    return null
  }

  const warningDescriptions: Record<DcaValidationWarning, string> = {
    [DcaValidationWarning.PriceImpact]: t("trade:dca.warnings.priceImpact", {
      percentage: order?.tradeImpactPct ?? 0,
    }),
  }

  return (
    <Flex direction="column" my="base" gap="s">
      {warnings.map((warning) => {
        switch (warning) {
          case DcaValidationWarning.PriceImpact:
            return (
              <DcaPriceImpactWarning
                key={warning}
                canContinue={isFormValid}
                message={warningDescriptions[warning]}
                accepted={priceImpactLossAccepted}
                onAcceptedChange={onPriceImpactLossAcceptedChange}
              />
            )

          default:
            return (
              <Alert
                key={warning}
                variant="warning"
                description={warningDescriptions[warning]}
              />
            )
        }
      })}
      {shouldRenderHealthFactorWarning && (
        <HealthFactorRiskWarning
          canContinue={isFormValid}
          message={
            isOpenBudget
              ? t("trade:dca.warnings.collateral")
              : t("healthFactor.warning")
          }
          toggleMessage={
            isOpenBudget
              ? t("trade:dca.warnings.collateral.confirmation")
              : undefined
          }
          accepted={healthFactorRiskAccepted}
          isUserConsentRequired={healthFactor.isUserConsentRequired}
          onAcceptedChange={onHealthFactorRiskAcceptedChange}
        />
      )}
    </Flex>
  )
}
