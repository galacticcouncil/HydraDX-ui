import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import {
  AssetInput,
  Box,
  LoadingButton,
  Modal,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Summary,
  SummaryRow,
} from "@galacticcouncil/ui/components"
import { useEvmAddress } from "@galacticcouncil/web3-connect"
import Big from "big.js"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useRepayHollarForm } from "@/modules/strategies/bil/components/RepayHollarModal.form"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { useBilPoolPosition } from "@/modules/strategies/bil/hooks/useBilPoolPosition"
import { useRepayHollar } from "@/modules/strategies/bil/hooks/useBilPoolWrites"
import { useUserBalances } from "@/modules/strategies/bil/hooks/useVaultReads"
import { getBilRepayHealthFactor } from "@/modules/strategies/bil/utils/hf"

interface Props {
  open: boolean
  onClose: () => void
}

export const RepayHollarModal = ({ open, onClose }: Props) => {
  const { t } = useTranslation(["strategies", "common"])

  const { hollar } = useBilStrategy()

  const evmAddress = useEvmAddress()
  const { data: poolPosition } = useBilPoolPosition(evmAddress)
  const { data: balances } = useUserBalances(evmAddress)
  const repayMutation = useRepayHollar({ onClose })

  const walletHollar = balances?.hollar ?? "0"
  const totalDebtUsd = poolPosition?.totalDebtUsd ?? 0

  const { control, handleSubmit, watch, formState } = useRepayHollarForm({
    totalDebt: totalDebtUsd.toString(),
    walletBalance: walletHollar,
  })

  const amount = watch("amount")
  const inputAmount = amount || "0"

  const healthFactor = poolPosition
    ? getBilRepayHealthFactor(poolPosition, inputAmount)
    : null
  const maxRepay = Big.min(walletHollar, totalDebtUsd.toString()).toString()

  const canSubmit =
    formState.isValid && !repayMutation.isPending && totalDebtUsd > 0

  const onSubmit = handleSubmit(({ amount }) => {
    if (!canSubmit) return
    repayMutation.mutate({
      amount,
      repayAll: Big(amount).gte(totalDebtUsd.toString()),
    })
  })

  const amountError = formState.errors.amount?.message
  const ctaLabel =
    amountError === t("bil.repay.cta.exceeds") ||
    amountError === t("bil.repay.cta.insufficient")
      ? amountError
      : t("bil.repay.cta.repay")

  return (
    <Modal
      variant="popup"
      open={open}
      onOpenChange={onClose}
      disableInteractOutside
    >
      <ModalHeader title={t("bil.repay.title")} />

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
                    symbol: hollar.symbol,
                    icon: <AssetLogo id={hollar.id} size="medium" />,
                  }}
                  value={field.value}
                  onChange={field.onChange}
                  displayValue={t("common:currency", {
                    value: inputAmount,
                  })}
                  balance={{
                    label: t("common:balance"),
                    value: t("common:number", { value: maxRepay }),
                    onMax: () => field.onChange(maxRepay),
                    isMaxDisabled: !(Number(maxRepay) > 0),
                  }}
                  amountError={fieldState.error?.message}
                />
              </Box>
            )}
          />

          {healthFactor && totalDebtUsd > 0 && (
            <Summary
              withLeadingSeparator
              separator={<ModalContentDivider />}
              mb="var(--modal-content-inset)"
            >
              <SummaryRow
                label={t("common:healthFactor")}
                content={<HealthFactorChange {...healthFactor} />}
              />
            </Summary>
          )}
        </ModalBody>

        <ModalFooter>
          <LoadingButton
            type="submit"
            size="large"
            width="100%"
            isLoading={repayMutation.isPending}
            disabled={!canSubmit}
          >
            {ctaLabel}
          </LoadingButton>
        </ModalFooter>
      </form>
    </Modal>
  )
}
