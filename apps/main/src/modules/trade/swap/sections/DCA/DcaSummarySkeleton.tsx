import {
  Flex,
  Skeleton,
  Summary,
  SummaryRowLabel,
  Text,
} from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"

export const DcaSummarySkeleton: FC = () => {
  const { t } = useTranslation(["common", "trade"])

  return (
    <div>
      <Flex direction="column" gap="base" py="base">
        <SummaryRowLabel>{t("summary")}</SummaryRowLabel>
        <Text fs="p4" lh={1.4}>
          <Skeleton sx={{ width: "100%" }} height="1em" />
        </Text>
      </Flex>
      <SwapSectionSeparator sx={{ mt: "s" }} />
      <Summary separator={<SwapSectionSeparator />}>
        <SwapSummaryRow
          label={t("trade:dca.summary.scheduleEnd")}
          content={
            <Flex ml="auto">
              <Skeleton sx={{ width: "3xl" }} height="1em" />
            </Flex>
          }
        />
        <SwapSummaryRow
          label={t("trade:dca.summary.slippage")}
          content={
            <Flex ml="auto">
              <Skeleton sx={{ width: "3xl" }} height="1em" />
            </Flex>
          }
        />
        <SwapSummaryRow
          label={t("trade:dca.summary.priceImpact")}
          content={
            <Flex ml="auto">
              <Skeleton sx={{ width: "3xl" }} height="1em" />
            </Flex>
          }
        />
      </Summary>
    </div>
  )
}
