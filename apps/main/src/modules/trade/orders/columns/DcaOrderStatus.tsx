import { Box } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { Status, SwapStatus } from "@/modules/trade/orders/columns/SwapStatus"
import {
  getDcaCompletionPercent,
  useDcaFundingBalance,
} from "@/modules/trade/orders/lib/dcaProgress"
import { OrderStatus } from "@/modules/trade/orders/lib/orderData"
import { TAsset } from "@/providers/assetsProvider"

type Props = {
  readonly status: OrderStatus
  readonly isDcaSwap?: boolean
  readonly sold?: string | null
  readonly total?: string | null
  readonly isOpenBudget?: boolean
  readonly from?: TAsset
}

export const DcaOrderStatus: FC<Props> = ({
  status,
  isDcaSwap = false,
  sold,
  total,
  isOpenBudget = false,
  from,
}) => {
  const { t } = useTranslation("trade")
  const fundingBalance = useDcaFundingBalance(from, isOpenBudget)

  if (isDcaSwap) return <SwapStatus />

  switch (status) {
    case OrderStatus.Terminated:
      return (
        <Status color={getToken("accents.danger.secondary")}>
          {t("trade.orders.status.terminated")}
        </Status>
      )
    case OrderStatus.Cancelled:
      return (
        <Status color={getToken("text.low")}>
          {t("trade.orders.status.cancelled")}
        </Status>
      )
    case OrderStatus.Created: {
      const percent = getDcaCompletionPercent({
        sold,
        total,
        isOpenBudget,
        fundingBalance,
      })

      return (
        <Status
          color={getToken("accents.success.emphasis")}
          display="inline-flex"
          alignItems="center"
          gap="s"
        >
          {t("trade.orders.status.active")}
          {percent !== null && <CompletionBar percent={percent} />}
          {percent !== null &&
            t("percent", {
              ns: "common",
              value: percent,
              maximumFractionDigits: 0,
            })}
        </Status>
      )
    }
    case OrderStatus.Completed:
      return (
        <Status color={getToken("text.tint.quart")}>
          {t("trade.orders.status.completed")}
        </Status>
      )
    case OrderStatus.Expired:
      return (
        <Status color={getToken("text.low")}>
          {t("trade.orders.status.expired")}
        </Status>
      )
    case OrderStatus.MigrationCancelled:
      return (
        <Status color={getToken("text.low")}>
          {t("trade.orders.status.refunded")}
        </Status>
      )
  }
}

const CompletionBar: FC<{ readonly percent: number }> = ({ percent }) => {
  const clipped = Math.min(100, Math.max(0, percent))

  return (
    <Box
      width="2.25rem"
      height="3xs"
      borderRadius="full"
      overflow="hidden"
      position="relative"
      flex="none"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clipped)}
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        sx={{ backgroundColor: "currentColor", opacity: 0.25 }}
      />
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        width={`${clipped}%`}
        sx={{ backgroundColor: "currentColor" }}
      />
    </Box>
  )
}
