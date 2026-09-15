import { Scale, ShieldCheck } from "@galacticcouncil/ui/assets/icons"
import {
  AssetInput,
  Box,
  Flex,
  Icon,
  LoadingButton,
  Paper,
  Separator,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { type ComponentType } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { useDepositForm } from "@/modules/strategies/propeller/components/DepositPanel.form"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"

interface VaultStats {
  exchangeRate: number
  totalAssets: number
  tvlCap: number
  paused: boolean
  depositsPaused: boolean
}

interface Balances {
  eth: number
  shares: number
}

interface Props {
  vaultStats: VaultStats
  balances: Balances
  onDeposit: (amount: string) => void
  isPending: boolean
}

export const DepositPanel = ({
  vaultStats,
  balances,
  onDeposit,
  isPending,
}: Props) => {
  const { t } = useTranslation(["propeller", "common"])
  const vault = useActivePropellerVault()

  const capacityKnown = vaultStats.tvlCap > 0
  const remainingCapacity = Math.max(
    vaultStats.tvlCap - vaultStats.totalAssets,
    0,
  )
  const atCapacity = capacityKnown && remainingCapacity <= 0
  const isPaused = vaultStats.depositsPaused || vaultStats.paused

  const balance = balances.eth.toString()
  const maxButtonBalance =
    capacityKnown && balances.eth > remainingCapacity
      ? remainingCapacity.toString()
      : balance

  const form = useDepositForm({
    maxBalance: balance,
    maxCapacity: capacityKnown ? remainingCapacity : Number.POSITIVE_INFINITY,
  })
  const { control, handleSubmit, watch, formState } = form
  const amount = watch("amount")

  const [spotDisplayValue, { isLoading: isSpotDisplayLoading }] =
    useDisplayAssetPrice(vault.assetId, amount || "0")

  const canSubmit = formState.isValid && !isPending && !isPaused && !atCapacity

  const ctaLabel = (() => {
    if (isPaused) return t("deposit.cta.paused")
    if (atCapacity) return t("deposit.cta.exceedsCapacity")
    return t("deposit.cta.deposit")
  })()

  const onSubmit = handleSubmit(({ amount }) => onDeposit(amount))

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
                  label={t("deposit.amount")}
                  symbol={vault.symbol}
                  selectedAssetIcon={
                    <AssetLogo id={vault.assetId} size="medium" />
                  }
                  modalDisabled
                  value={field.value}
                  onChange={field.onChange}
                  displayValue={spotDisplayValue}
                  displayValueLoading={isSpotDisplayLoading}
                  maxBalance={balance}
                  maxButtonBalance={maxButtonBalance}
                  amountError={fieldState.error?.message}
                />
              )}
            />
          </Box>

          <Separator mx="-xl" />

          <Stack gap="l" py="xl">
            <BenefitCard
              icon={ShieldCheck}
              label={t("deposit.benefit.noLiquidations")}
              description={t("deposit.benefit.noLiquidationsDescription")}
            />
            <BenefitCard
              icon={Scale}
              label={t("deposit.benefit.noImpermanentLoss")}
              description={t("deposit.benefit.noImpermanentLossDescription")}
            />
          </Stack>

          <Separator mx="-xl" />

          <Box py="xl">
            <AuthorizedAction size="large" width="100%">
              <LoadingButton
                type="submit"
                size="large"
                width="100%"
                isLoading={isPending}
                disabled={!canSubmit}
              >
                {ctaLabel}
              </LoadingButton>
            </AuthorizedAction>
          </Box>
        </Paper>
      </form>
    </FormProvider>
  )
}

const BenefitCard = ({
  icon,
  label,
  description,
}: {
  icon: ComponentType
  label: string
  description: string
}) => {
  const color = getToken("text.tint.quart")

  return (
    <Stack gap="s" align="flex-start">
      <Flex align="center" gap="s">
        <Icon component={icon} size="s" color={color} />
        <Text fs="p5" lh={1} fw={600} color={color}>
          {label}
        </Text>
      </Flex>
      <Text fs="p5" color={getToken("text.medium")}>
        {description}
      </Text>
    </Stack>
  )
}
