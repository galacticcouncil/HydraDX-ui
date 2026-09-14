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
  Skeleton,
  Summary,
  SummaryRow,
  Text,
} from "@galacticcouncil/ui/components"
import { useEvmAddress } from "@galacticcouncil/web3-connect"
import Big from "big.js"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { useBorrowHollarForm } from "@/modules/strategies/bil/components/BorrowHollarModal.form"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { useBilMaxBorrowable } from "@/modules/strategies/bil/hooks/useBilPoolPosition"
import { useBorrowHollar } from "@/modules/strategies/bil/hooks/useBilPoolWrites"
import { getBilBorrowHealthFactor } from "@/modules/strategies/bil/utils/hf"

interface Props {
  open: boolean
  onClose: () => void
}

export const BorrowHollarModal = ({ open, onClose }: Props) => {
  const { t } = useTranslation(["strategies", "borrow", "common"])

  const { hollar } = useBilStrategy()

  const evmAddress = useEvmAddress()
  const {
    maxBorrowableUsd,
    isLoading: isMaxBorrowableLoading,
    poolPosition,
  } = useBilMaxBorrowable(evmAddress)
  const borrowMutation = useBorrowHollar({ onClose })

  const hasCollateral = !!poolPosition?.hasCollateral
  const maxBorrowableUsed = maxBorrowableUsd.toString()

  const { control, handleSubmit, watch, formState } = useBorrowHollarForm({
    maxBorrowable: maxBorrowableUsed,
  })

  const amount = watch("amount")
  const inputAmount = amount || "0"

  const healthFactor = poolPosition
    ? getBilBorrowHealthFactor(poolPosition, inputAmount)
    : null
  const isLiquidationRisk =
    !!healthFactor &&
    !Big(healthFactor.future).eq(-1) &&
    Big(healthFactor.future).lte(1)

  const canSubmit =
    formState.isValid &&
    !isLiquidationRisk &&
    !borrowMutation.isPending &&
    !isMaxBorrowableLoading &&
    hasCollateral

  const showSummary = hasCollateral

  const onSubmit = handleSubmit(({ amount }) => {
    if (!canSubmit) return
    borrowMutation.mutate(amount)
  })

  return (
    <Modal
      variant="popup"
      open={open}
      onOpenChange={onClose}
      disableInteractOutside
    >
      <ModalHeader title={t("bil.borrow.title")} />

      <form onSubmit={onSubmit}>
        <ModalBody>
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <Box py={0} pb="l" width="100%">
                <AssetInput
                  label={t("bil.borrow.selectAsset")}
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
                    label: t("common:available"),
                    value: t("common:number", { value: maxBorrowableUsed }),
                    onMax: () => field.onChange(maxBorrowableUsed),
                    isMaxDisabled: !(Number(maxBorrowableUsed) > 0),
                  }}
                  amountError={fieldState.error?.message}
                />
              </Box>
            )}
          />

          {showSummary && (
            <Summary
              withLeadingSeparator
              separator={<ModalContentDivider />}
              mb="var(--modal-content-inset)"
            >
              {healthFactor && (
                <SummaryRow
                  label={t("common:healthFactor")}
                  content={<HealthFactorChange {...healthFactor} />}
                />
              )}
              <SummaryRow
                label={t("borrow:borrow.available")}
                content={
                  isMaxBorrowableLoading ? (
                    <Skeleton width="100%" height="1.5em" />
                  ) : (
                    <Text fs="p4" lh={1.5}>
                      {t("common:currency.compact", {
                        value: maxBorrowableUsd,
                        symbol: hollar.symbol,
                      })}
                    </Text>
                  )
                }
              />
            </Summary>
          )}
        </ModalBody>

        <ModalContentDivider />

        <ModalFooter>
          <LoadingButton
            type="submit"
            size="large"
            width="100%"
            isLoading={borrowMutation.isPending}
            disabled={!canSubmit}
          >
            {t("borrow:borrow")} {hollar.symbol}
          </LoadingButton>
        </ModalFooter>
      </form>
    </Modal>
  )
}
