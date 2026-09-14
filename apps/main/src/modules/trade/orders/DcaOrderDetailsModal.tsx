import { SquareArrowOutUpRight, Trash } from "@galacticcouncil/ui/assets/icons"
import {
  Amount,
  Button,
  Chip,
  ExternalLink,
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
import { neckwork } from "@galacticcouncil/utils"
import Big from "big.js"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useBlockTime } from "@/api/chain"
import { DcaOrderStatus } from "@/modules/trade/orders/columns/DcaOrderStatus"
import { SwapAmount } from "@/modules/trade/orders/columns/SwapAmount"
import {
  getDcaCompletionPercent,
  getDcaTradeProgress,
  useDcaFundingBalance,
} from "@/modules/trade/orders/lib/dcaProgress"
import {
  DcaOrderData,
  IntentDcaOrderData,
  isDcaScheduleOrder,
  OrderStatus,
} from "@/modules/trade/orders/lib/orderData"
import { useLimitFillStatus } from "@/modules/trade/orders/lib/useLimitFillStatus"
import { DcaOrderProgress } from "@/modules/trade/orders/PastExecutions/DcaOrderProgress"

type Props = {
  readonly details: DcaOrderData | IntentDcaOrderData
  readonly onTerminate: (() => void) | null
  readonly pastExecutions: ReactNode
  readonly isSpentLoading?: boolean
  readonly isReceivedLoading?: boolean
}

export const DcaOrderDetailsModal = ({
  details,
  onTerminate,
  pastExecutions,
  isSpentLoading = false,
  isReceivedLoading = false,
}: Props) => {
  const { data: blockTimeMs } = useBlockTime()
  const { t } = useTranslation(["common", "trade"])
  const fundingBalance = useDcaFundingBalance(
    details.from,
    details.isOpenBudget,
  )

  const blocksPeriod = details.blocksPeriod ? Big(details.blocksPeriod) : null

  const { orderRate, marketRate, distancePct, fillable } = useLimitFillStatus({
    from: details.from,
    to: details.to,
    sellAmount: details.limitPrice ? details.singleTradeSize : null,
    receiveAmount: details.limitPrice ? details.toAmountExecuted : null,
  })

  const spentOrBudgetLabel = details.isOpenBudget
    ? t("spent")
    : `${t("remaining")} / ${t("budget")}`

  const spentOrBudgetValue = details.isOpenBudget
    ? details.fromAmountExecuted
      ? t("currency", {
          value: details.fromAmountExecuted,
          symbol: details.from.symbol,
        })
      : details.from.symbol
    : t("trade:trade.orders.dcaDetail.remainingBudget", {
        remaining:
          details.status === OrderStatus.Completed
            ? "0"
            : (details.fromAmountRemaining ?? details.fromAmountBudget),
        budget: details.fromAmountBudget,
        symbol: details.from.symbol,
      })

  const receivedValue = details.toAmountExecuted
    ? t("currency", {
        value: details.toAmountExecuted,
        symbol: details.to.symbol,
      })
    : details.to.symbol

  const isActive = details.status === OrderStatus.Created
  const progressPercent = isActive
    ? getDcaCompletionPercent({
        sold: details.fromAmountExecuted,
        total: details.fromAmountBudget,
        isOpenBudget: details.isOpenBudget,
        fundingBalance,
      })
    : null
  const tradeProgress = isActive
    ? getDcaTradeProgress({
        sold: details.fromAmountExecuted,
        total: details.fromAmountBudget,
        singleTradeSize: details.singleTradeSize,
        isOpenBudget: details.isOpenBudget,
        fundingBalance,
      })
    : null

  let tradesLabel: string | null = null
  if (tradeProgress !== null && tradeProgress.remaining > 0) {
    tradesLabel = t("trade:trade.orders.dcaDetail.tradesProgress", {
      executed: tradeProgress.executed,
      total: tradeProgress.executed + tradeProgress.remaining,
    })
  } else if (tradeProgress !== null) {
    tradesLabel = t("trade:trade.orders.dcaDetail.tradesCount", {
      count: tradeProgress.executed,
    })
  }

  return (
    <>
      <ModalHeader
        title={t("trade:trade.orders.dcaDetail.title")}
        align="center"
      />
      <ModalBody scrollable={false}>
        <Flex justify="space-between" align="center" pb="xl">
          <SwapAmount
            fromAmount={
              details.isOpenBudget
                ? details.fromAmountExecuted
                : details.fromAmountBudget
            }
            toAmount={
              details.isOpenBudget ? details.toAmountExecuted : undefined
            }
            from={details.from}
            to={details.to}
            showLogo
          />
          {details.status && <DcaOrderStatus status={details.status} />}
        </Flex>
        <ModalContentDivider />
        <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
          <Amount
            label={spentOrBudgetLabel}
            value={spentOrBudgetValue}
            isLoading={isSpentLoading}
          />
          <Separator orientation="vertical" />
          <Amount
            label={t("received")}
            value={receivedValue}
            isLoading={isReceivedLoading}
          />
        </Grid>
        <ModalContentDivider />
        <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
          {blocksPeriod && (
            <>
              <Amount
                label={t("trade:trade.orders.dcaDetail.blockInterval")}
                value={
                  blockTimeMs !== undefined
                    ? t("trade:trade.orders.dcaDetail.schedulePeriod", {
                        timeframe: blocksPeriod.times(blockTimeMs).toNumber(),
                        count: blocksPeriod.toNumber(),
                      })
                    : "-"
                }
              />
              <Separator orientation="vertical" />
            </>
          )}
          <Amount
            label={t("trade:trade.orders.dcaDetail.singleTradeSize")}
            value={t("currency", {
              value: details.singleTradeSize,
              symbol: details.from.symbol,
            })}
          />
        </Grid>
        {details.limitPrice && (
          <>
            <ModalContentDivider />
            <Grid columnTemplate="1fr 1px 1fr" gap="xxl" py="xl">
              <Amount
                label={t("trade:trade.orders.dcaDetail.limitPrice")}
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
            {orderRate && isActive && (
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
          </>
        )}
        {progressPercent !== null && (
          <>
            <ModalContentDivider />
            <Grid columnTemplate="1fr" gap="xxl" py="xl">
              <DcaOrderProgress
                percent={progressPercent}
                tradesLabel={tradesLabel}
              />
            </Grid>
          </>
        )}
        <ModalContentDivider />
        <Flex justify="space-between" gap="base" pt="l" pb="xl">
          {isDcaScheduleOrder(details) && (
            <Button variant="tertiary" outline asChild>
              <ExternalLink href={neckwork.activityDca(details.scheduleId)}>
                <Icon component={SquareArrowOutUpRight} size="xs" />
                <Text fw={500} fs="p6" lh={1.4}>
                  {t("openInExplorer")}
                </Text>
              </ExternalLink>
            </Button>
          )}
          {details.status === OrderStatus.Created && onTerminate && (
            <Button variant="danger" outline onClick={onTerminate}>
              <Icon component={Trash} size="s" />
              {t("trade:trade.cancelOrder.cta")}
            </Button>
          )}
        </Flex>
        {pastExecutions}
      </ModalBody>
    </>
  )
}
