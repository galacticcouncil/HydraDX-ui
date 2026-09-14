import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import {
  AssetInput,
  Box,
  Button,
  Checkbox,
  Flex,
  Label,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  Separator,
  Summary,
  SummaryRow,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useEvmAddress } from "@galacticcouncil/web3-connect"
import Big from "big.js"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import {
  projectRate,
  WithdrawMethodPicker,
} from "@/modules/strategies/bil/components/WithdrawMethodPicker"
import { useWithdrawForm } from "@/modules/strategies/bil/components/WithdrawModalForm.form"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import {
  useBilPoolPosition,
  useBilReserveConfig,
} from "@/modules/strategies/bil/hooks/useBilPoolPosition"
import { useInstantQuote } from "@/modules/strategies/bil/hooks/useStableswap"
import {
  useUserBalances,
  useVaultStats,
} from "@/modules/strategies/bil/hooks/useVaultReads"
import {
  getBilMaxWithdrawable,
  getBilWithdrawHealthFactor,
} from "@/modules/strategies/bil/utils/hf"

interface Props {
  withdrawSource: "supplied" | "raw"
  onRequestRedeem: (amount: string) => void
  onInstantRedeem: (amount: string) => void
  isPending: boolean
}

export const WithdrawModalForm = ({
  withdrawSource,
  onRequestRedeem,
  onInstantRedeem,
  isPending,
}: Props) => {
  const { t } = useTranslation(["strategies", "common"])
  const { bil } = useBilStrategy()
  const evmAddress = useEvmAddress()

  const { data: vaultStats } = useVaultStats()
  const { data: balances } = useUserBalances(evmAddress)
  const { data: poolPosition } = useBilPoolPosition(evmAddress)
  const { data: reserveConfig } = useBilReserveConfig()

  const isSuppliedWithdraw = withdrawSource === "supplied"
  const bilBalance = isSuppliedWithdraw
    ? (balances?.bilSupplied ?? "0")
    : (balances?.bilRaw ?? "0")
  const hfContextEnabled =
    isSuppliedWithdraw && !!poolPosition && !!reserveConfig

  const hfContext = hfContextEnabled
    ? {
        poolPosition,
        reserveConfig,
        suppliedBalance: bilBalance,
        exchangeRate: vaultStats.exchangeRate,
      }
    : null

  const maxWithdrawable = hfContext
    ? Big.min(bilBalance, getBilMaxWithdrawable(hfContext))
    : Big(bilBalance)

  const form = useWithdrawForm({
    asset: bil,
    maxWithdrawable: maxWithdrawable.toString(),
    minRedeem: vaultStats.minRedeem,
  })

  const { control, handleSubmit, watch, formState } = form
  const [amount, method] = watch(["amount", "method"])

  const isMaxSelected = !!amount && Big(amount).gte(maxWithdrawable.toString())
  const withdrawAmount = isMaxSelected ? maxWithdrawable.toString() : amount
  const usdValue = Big(withdrawAmount || "0")
    .times(vaultStats.exchangeRate)
    .toString()

  const healthFactor =
    !!reserveConfig?.borrowingEnabled && hfContext
      ? getBilWithdrawHealthFactor({
          ...hfContext,
          withdrawAmount,
        })
      : null

  const projectedQueueRate = projectRate(
    vaultStats.exchangeRate,
    vaultStats.apr,
    vaultStats.worstCaseWaitDays,
  )
  const queueHollarOut = Big(withdrawAmount || "0")
    .times(projectedQueueRate)
    .toString()
  const { quote: instantQuote } = useInstantQuote(
    withdrawAmount,
    queueHollarOut,
  )

  const canSubmit = formState.isValid && !isPending

  const onSubmit = handleSubmit(({ amount, method }) => {
    const isMaxSelected =
      !!amount && Big(amount).gte(maxWithdrawable.toString())
    const withdrawAmount = isMaxSelected ? maxWithdrawable.toString() : amount

    if (method === "queue") {
      onRequestRedeem(withdrawAmount)
    } else {
      onInstantRedeem(withdrawAmount)
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <ModalBody>
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <Box py={0} pb="l" width="100%">
                <AssetInput
                  label={t("common:amount")}
                  asset={{
                    symbol: bil.symbol,
                    icon: <AssetLogo id={bil.id} />,
                  }}
                  value={field.value}
                  onChange={field.onChange}
                  displayValue={
                    Big(withdrawAmount || "0").gt(0)
                      ? t("common:currency", { value: usdValue })
                      : t("common:currency", { value: 0 })
                  }
                  balance={{
                    label: t("common:withdrawableBalance"),
                    value: t("common:number", { value: maxWithdrawable }),
                    onMax: () => field.onChange(maxWithdrawable.toString()),
                    isMaxDisabled: Big(maxWithdrawable).lte(0),
                  }}
                  amountError={fieldState.error?.message}
                />
              </Box>
            )}
          />

          <ModalContentDivider />

          <Box py="l">
            <Text fs="p5" fw={500} color={getToken("text.medium")} mb="m">
              {t("bil.withdraw.method")}
            </Text>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <WithdrawMethodPicker
                  selected={field.value}
                  onSelect={field.onChange}
                  amountBil={withdrawAmount}
                  exchangeRate={vaultStats.exchangeRate}
                  aprPercent={vaultStats.apr}
                  worstCaseWaitDays={vaultStats.worstCaseWaitDays}
                  instantQuote={instantQuote}
                />
              )}
            />
          </Box>

          {healthFactor && (
            <Summary withLeadingSeparator separator={<ModalContentDivider />}>
              <SummaryRow
                label={t("common:healthFactor")}
                content={<HealthFactorChange {...healthFactor} />}
              />
            </Summary>
          )}
          <ModalContentDivider />

          <Flex align="center" gap="base" pt="l">
            <Controller
              control={control}
              name="acknowledged"
              render={({ field }) => (
                <Label
                  fs="p4"
                  lh={1.2}
                  fw={500}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "base",
                    cursor: "pointer",
                  }}
                >
                  <Checkbox
                    name="withdraw-ack"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                  {method === "instant"
                    ? t("bil.withdraw.ackInstant")
                    : t("bil.withdraw.ack")}
                </Label>
              )}
            />
          </Flex>
        </ModalBody>
        <Separator />
        <ModalFooter>
          <Button type="submit" size="large" width="100%" disabled={!canSubmit}>
            {t("common:withdraw")}
          </Button>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}
