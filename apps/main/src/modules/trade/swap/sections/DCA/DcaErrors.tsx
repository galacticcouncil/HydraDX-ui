import { Alert, Flex } from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { DcaValidationError } from "@/modules/trade/swap/sections/DCA/useDcaValidation"

type Props = {
  readonly priceImpact: number
  readonly errors: ReadonlyArray<DcaValidationError>
}

export const DcaErrors: FC<Props> = ({ priceImpact, errors }) => {
  const { t } = useTranslation(["common", "trade"])

  if (!errors.length) {
    return null
  }

  const errorDescriptions: Record<DcaValidationError, string> = {
    [DcaValidationError.PriceImpact]: t("trade:dca.errors.priceImpact", {
      percentage: t("percent", { value: priceImpact }),
    }),
    [DcaValidationError.MinOrderBudget]: t("trade:dca.errors.minOrderBudget"),
  }

  return (
    <Flex direction="column" my="base" gap="s">
      {errors.map((error) => (
        <Alert
          key={error}
          variant="error"
          description={errorDescriptions[error]}
        />
      ))}
    </Flex>
  )
}
