import { Trash } from "@galacticcouncil/ui/assets/icons"
import {
  Amount,
  Button,
  Chip,
  Flex,
  Grid,
  Icon,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Separator,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { DcaOrderStatus } from "@/modules/trade/orders/columns/DcaOrderStatus"
import { SwapAmount } from "@/modules/trade/orders/columns/SwapAmount"
import {
  IntentLimitOrderData,
  OrderStatus,
} from "@/modules/trade/orders/lib/orderData"
import { useLimitFillStatus } from "@/modules/trade/orders/lib/useLimitFillStatus"
import { useRemoveIntent } from "@/modules/trade/orders/lib/useRemoveIntent"

type Props = {
  readonly details: IntentLimitOrderData
  readonly onCancel: () => void
  readonly pastExecutions?: ReactNode
  readonly isSpentLoading?: boolean
  readonly isReceivedLoading?: boolean
}

export const LimitOrderDetailsModal = ({
  details,
  onCancel,
  pastExecutions = null,
  isSpentLoading = false,
  isReceivedLoading = false,
}: Props) => {
  const { t } = useTranslation(["common", "trade"])
  const removeIntent = useRemoveIntent()

  const { orderRate, marketRate, distancePct, fillable } = useLimitFillStatus({
    from: details.from,
    to: details.to,
    sellAmount: details.fromAmountBudget,
    receiveAmount: details.toAmountBudget,
  })

  return (
    <>
      <ModalHeader title={t("trade:trade.orders.limit.title")} align="center" />
      <ModalBody scrollable={false}>
        <Flex justify="space-between" align="center" pb="xl">
          <Flex direction="column" gap="s">
            {details.isPartiallyFillable && (
              <Text fs="p6" fw={500}>
                {t("trade:limit.partiallyFillable")}
              </Text>
            )}
            <SwapAmount
              fromAmount={details.fromAmountBudget}
              toAmount={details.toAmountBudget}
              from={details.from}
              to={details.to}
              showLogo
            />
          </Flex>
          {details.status && <DcaOrderStatus status={details.status} />}
        </Flex>
        <ModalContentDivider />
        <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
          <Amount
            label={t("trade:trade.orders.limit.filledFrom")}
            isLoading={isSpentLoading}
            value={
              details.fromAmountExecuted
                ? t("currency", {
                    value: details.fromAmountExecuted,
                    symbol: details.from.symbol,
                  })
                : "-"
            }
          />
          <Separator orientation="vertical" />
          <Amount
            label={t("trade:trade.orders.limit.filledTo")}
            isLoading={isReceivedLoading}
            value={
              details.toAmountExecuted
                ? t("currency", {
                    value: details.toAmountExecuted,
                    symbol: details.to.symbol,
                  })
                : "-"
            }
          />
        </Grid>
        <ModalContentDivider />
        <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
          <Amount
            label={t("trade:trade.orders.limit.limitPrice")}
            value={
              orderRate
                ? t("trade:trade.orders.pricePair", {
                    value: orderRate,
                    leftSymbol: details.to.symbol,
                    rightSymbol: details.from.symbol,
                  })
                : "-"
            }
          />
          <Separator orientation="vertical" />
          <Amount
            label={t("trade:trade.orders.limit.marketPrice")}
            value={
              marketRate
                ? t("trade:trade.orders.pricePair", {
                    value: marketRate,
                    leftSymbol: details.to.symbol,
                    rightSymbol: details.from.symbol,
                  })
                : "-"
            }
          />
        </Grid>
        {orderRate && details.status === OrderStatus.Created && (
          <>
            <ModalContentDivider />
            <Flex direction="column" gap="s" py="xl" align="flex-start">
              <Text fs="p5" color={getToken("text.high")}>
                {t("trade:trade.orders.limit.fillsWhen", {
                  fromSymbol: details.from.symbol,
                  rate: t("number", { value: orderRate }),
                  toSymbol: details.to.symbol,
                })}
              </Text>
              {distancePct !== null &&
                (fillable ? (
                  <Chip variant="green" size="small">
                    {t("trade:trade.orders.limit.fillableNow")}
                  </Chip>
                ) : (
                  <Chip variant="secondary" size="small">
                    {t("trade:trade.orders.limit.away", {
                      pct: Math.abs(distancePct),
                    })}
                  </Chip>
                ))}
            </Flex>
          </>
        )}
        <ModalContentDivider />
        <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
          <Amount
            label={t("trade:trade.orders.limit.creationDate")}
            value={
              details.timestamp
                ? t("date.datetime", {
                    value: new Date(details.timestamp),
                  })
                : "-"
            }
          />
          <Separator orientation="vertical" />
          <Amount
            label={t("trade:trade.orders.limit.expirationDate")}
            value={
              details.deadline
                ? t("date.datetime", {
                    value: new Date(details.deadline),
                  })
                : "-"
            }
          />
        </Grid>
        {details.status === OrderStatus.Created && (
          <>
            <ModalContentDivider />
            <Flex justify="flex-end" pt="l">
              <Button
                variant="danger"
                outline
                onClick={() => {
                  removeIntent.mutate(details.intentId, {
                    onSuccess: () => onCancel(),
                  })
                }}
              >
                <Icon component={Trash} size="s" />
                {t("trade:trade.orders.limit.cancelOrder")}
              </Button>
            </Flex>
          </>
        )}
        {pastExecutions}
      </ModalBody>
    </>
  )
}
