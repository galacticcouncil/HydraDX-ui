import { ChevronDown, ChevronUp } from "@galacticcouncil/ui/assets/icons"
import {
  Box,
  Flex,
  Icon,
  SummaryRowDisplayValue,
  SummaryRowValue,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC, ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { useTradeSettings } from "@/states/tradeSettings"

type Props = {
  readonly label: string
  readonly tooltip: string
  readonly amount: ReactNode
  readonly amountDisplay: ReactNode
  readonly isExpanded: boolean
  readonly isLoading: boolean
  readonly onIsExpandedChange: (isExpanded: boolean) => void
}

export const CalculatedAmountSummaryRow: FC<Props> = ({
  label,
  tooltip,
  amount,
  amountDisplay,
  isExpanded,
  isLoading,
  onIsExpandedChange,
}) => {
  const { t } = useTranslation(["common", "trade"])

  const {
    swap: {
      single: { swapSlippage },
      split: { twapSlippage },
    },
  } = useTradeSettings()

  return (
    <SwapSummaryRow
      sx={{ alignItems: "flex-start" }}
      label={label}
      loading={isLoading}
      content={
        <Flex align="center">
          <Flex gap="s" align="center" justify="flex-end">
            {typeof amount === "string" ? (
              <SummaryRowValue>{amount}</SummaryRowValue>
            ) : (
              amount
            )}
            {typeof amountDisplay === "string" ? (
              <SummaryRowDisplayValue>{amountDisplay}</SummaryRowDisplayValue>
            ) : (
              amountDisplay
            )}
          </Flex>
          <Icon
            component={isExpanded ? ChevronUp : ChevronDown}
            size="m"
            sx={{ mr: "-s" }}
            color={getToken("icons.onContainer")}
          />
        </Flex>
      }
      onClick={(e) => {
        e.preventDefault()
        onIsExpandedChange(!isExpanded)
      }}
      tooltip={
        <Flex direction="column" gap="base">
          <Box>{tooltip}</Box>
          <Box>
            <Flex justify="space-between">
              <Box>
                {t("trade:market.summary.calculatedAmount.tooltip.single")}
              </Box>
              <Box>{t("percent", { value: swapSlippage })}</Box>
            </Flex>
            <Flex justify="space-between">
              <Box>
                {t("trade:market.summary.calculatedAmount.tooltip.split")}
              </Box>
              <Box>{t("percent", { value: twapSlippage })}</Box>
            </Flex>
          </Box>
        </Flex>
      }
    />
  )
}
