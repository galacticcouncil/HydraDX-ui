import { Hourglass, Lock, Zap } from "@galacticcouncil/ui/assets/icons"
import {
  Alert,
  AssetInput,
  Box,
  Flex,
  Icon,
  LoadingButton,
  Paper,
  Separator,
  Stack,
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
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { useBilDepositForm } from "@/modules/strategies/bil/components/BilDeposit.form"
import { BilExchangeRate } from "@/modules/strategies/bil/components/BilExchangeRate"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import {
  useUserBalances,
  useVaultStats,
} from "@/modules/strategies/bil/hooks/useVaultReads"
import { useDeposit } from "@/modules/strategies/bil/hooks/useVaultWrites"

export const BilDeposit = () => {
  const { t } = useTranslation(["strategies", "common"])
  const { bil, hollar } = useBilStrategy()

  const evmAddress = useEvmAddress()
  const { data: vaultStats } = useVaultStats()
  const { data: balances } = useUserBalances(evmAddress)
  const depositMutation = useDeposit()

  const balance = balances?.hollar ?? "0"

  // Deposits must clear the *lower* of the vault tvlCap and the pool
  // supplyCap — `remainingDepositHollar` is that binding ceiling, in HOLLAR.
  // `tvlCap > 0` is our "stats loaded" signal: the query seeds default stats
  // (remaining 0) before the first fetch, and we must not flash "at capacity"
  // or block input during that window.
  const capacityKnown = vaultStats.tvlCap > 0
  const remaining = vaultStats.remainingDepositHollar
  const atCapacity = capacityKnown && remaining <= 0

  const maxButtonBalance =
    !capacityKnown || atCapacity
      ? balance
      : Big.min(balance, remaining).toString()

  const form = useBilDepositForm({
    maxBalance: balance,
    minDeposit: vaultStats.minDeposit,
    symbol: hollar.symbol,
    // Skip the capacity ceiling until stats load (Infinity = not enforced).
    maxCapacity: capacityKnown ? remaining : Number.POSITIVE_INFINITY,
  })

  const { control, handleSubmit, watch, formState } = form
  const amount = watch("amount")

  const outputBil =
    vaultStats.exchangeRate > 0
      ? Big(amount || "0")
          .div(vaultStats.exchangeRate)
          .toString()
      : "0"
  const outputHollar =
    vaultStats.exchangeRate > 0
      ? Big(outputBil).times(vaultStats.exchangeRate).toString()
      : "0"

  const canSubmit =
    formState.isValid &&
    !depositMutation.isPending &&
    !vaultStats.depositsPaused &&
    !atCapacity

  const ctaLabel = vaultStats.depositsPaused
    ? t("bil.deposit.cta.paused")
    : atCapacity
      ? t("bil.deposit.cta.full")
      : t("common:deposit")

  const onSubmit = handleSubmit(({ amount }) => {
    depositMutation.mutate(amount)
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Paper px="xl" position="relative">
          <Box>
            <Controller
              control={control}
              name="amount"
              render={({ field, fieldState }) => (
                <AssetInput
                  label={t("bil.deposit.your")}
                  symbol={hollar.symbol}
                  selectedAssetIcon={<AssetLogo id={hollar.id} />}
                  modalDisabled
                  value={field.value}
                  onChange={field.onChange}
                  displayValue={t("common:currency", {
                    value: amount || "0",
                  })}
                  maxBalance={balance}
                  maxButtonBalance={maxButtonBalance}
                  amountError={fieldState.error?.message}
                />
              )}
            />

            <BilExchangeRate exchangeRate={vaultStats.exchangeRate} />

            <AssetInput
              label={t("bil.deposit.youReceive")}
              symbol={bil.symbol}
              selectedAssetIcon={<AssetLogo id={bil.id} />}
              modalDisabled
              disabledInput
              ignoreBalance
              value={outputBil}
              displayValue={t("common:currency", {
                value: outputHollar,
              })}
            />
          </Box>

          <Separator mx="-xl" />

          <Summary separator={<Separator mx="-xl" />}>
            {capacityKnown && (
              <SummaryRow
                label={<Text fs="p5">{t("bil.deposit.remaining")}</Text>}
                content={t("bil.deposit.remainingValue", {
                  value: remaining,
                  symbol: hollar.symbol,
                })}
              />
            )}
            <SummaryRow
              label={
                <Flex align="center" gap="base">
                  <Icon component={Lock} size="xs" />
                  <Text fs="p5">{t("bil.deposit.lockup")}</Text>
                </Flex>
              }
              content={t("bil.deposit.lockupValue", {
                days: vaultStats.maxLockupDays,
              })}
            />
            <Box>
              <Text fs="p5" color={getToken("text.medium")} pt="m" pb="s">
                {t("bil.deposit.redeemOptions")}:
              </Text>
              <SummaryRow
                label={
                  <Flex
                    align="center"
                    gap="base"
                    sx={{ color: getToken("text.tint.quart") }}
                  >
                    <Icon component={Hourglass} size="xs" />
                    <Text fs="p5" fw={500} color={getToken("text.tint.quart")}>
                      {t("bil.deposit.option.queue")}
                    </Text>
                  </Flex>
                }
                content={
                  <Text sx={{ flex: 1 }}>
                    {t("bil.deposit.option.queueValue", {
                      days: vaultStats.maxLockupDays,
                    })}
                  </Text>
                }
              />
            </Box>
            <SummaryRow
              label={
                <Flex
                  align="center"
                  gap="base"
                  sx={{ color: getToken("accents.success.emphasis") }}
                >
                  <Icon component={Zap} size="xs" />
                  <Text
                    fs="p5"
                    fw={500}
                    color={getToken("accents.success.emphasis")}
                  >
                    {t("bil.deposit.option.instant")}
                  </Text>
                </Flex>
              }
              content={
                <Text align="right" sx={{ flex: 1 }}>
                  {t("bil.deposit.option.instantValue")}
                </Text>
              }
            />
          </Summary>

          <Separator mx="-xl" />

          <Stack gap="l" py="xl">
            {atCapacity && (
              <Alert
                variant="warning"
                title={t("bil.deposit.cta.full")}
                description={t(
                  vaultStats.depositLimitBinding === "pool"
                    ? "bil.deposit.capacityAlert.description.pool"
                    : "bil.deposit.capacityAlert.description.vault",
                  {
                    value: vaultStats.tvlCap,
                    symbol: hollar.symbol,
                  },
                )}
              />
            )}
            <AuthorizedAction size="large" width="100%">
              <LoadingButton
                type="submit"
                size="large"
                width="100%"
                variant={!canSubmit ? "tertiary" : "primary"}
                isLoading={depositMutation.isPending}
                disabled={!canSubmit}
              >
                {ctaLabel}
              </LoadingButton>
            </AuthorizedAction>
          </Stack>
        </Paper>
      </form>
    </FormProvider>
  )
}
