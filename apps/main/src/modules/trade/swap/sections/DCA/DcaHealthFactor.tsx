import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { TradeDcaOrder } from "@galacticcouncil/sdk-next/sor"
import { Summary } from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"

type Props = {
  readonly order: TradeDcaOrder | undefined | null
  readonly healthFactor: HealthFactorResult | undefined
  readonly isLoading: boolean
}

export const DcaHealthFactor: FC<Props> = ({
  order,
  healthFactor,
  isLoading,
}) => {
  const { t } = useTranslation(["common", "trade"])

  if (isLoading || !order || !healthFactor?.isSignificantChange) {
    return null
  }

  return (
    <Summary separator={<SwapSectionSeparator />}>
      <SwapSummaryRow
        label={t("healthFactor")}
        content={<HealthFactorChange {...healthFactor} />}
      />
    </Summary>
  )
}
