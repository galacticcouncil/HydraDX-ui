import IconWarning from "assets/icons/WarningIcon.svg?react"
import BN from "bignumber.js"
import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { DEPOSIT_CLASS_ID } from "utils/api"
import { STradingPairContainer } from "./RemoveLiquidity.styled"
import { FeeRange } from "./components/FeeRange/FeeRange"
import { RemoveLiquidityReward } from "./components/RemoveLiquidityReward"
import { RemoveLiquidityInput } from "./components/RemoveLiquidityInput"

import {
  RemoveLiquidityProps,
  useRemoveLiquidity,
} from "./RemoveLiquidity.utils"
import { useAssets } from "providers/assets"

export const RemoveLiquidityForm = ({
  onClose,
  onSuccess,
  onSubmitted,
  position,
}: RemoveLiquidityProps) => {
  const { t } = useTranslation()
  const { hub } = useAssets()
  const isPositionMultiple = Array.isArray(position)

  const form = useForm<{ value: number }>({
    defaultValues: { value: isPositionMultiple ? 100 : 25 },
  })

  const lrnaMeta = hub
  const value = form.watch("value")

  const onSubmit = (value: string) => {
    onSubmitted?.(value)
    form.reset()
  }

  const {
    values,
    removeValue,
    totalValue,
    isFeeExceeded,
    mutation,
    meta: { id, symbol, name },
  } = useRemoveLiquidity(position, value, onClose, onSuccess, onSubmit)

  const tokensToGet =
    values && values?.tokensToGetShifted.gt(0)
      ? values.tokensToGetShifted
      : BN(0)

  return (
    <form
      onSubmit={form.handleSubmit(() => mutation.mutate())}
      autoComplete="off"
      sx={{
        flex: "column",
        justify: "space-between",
        minHeight: "100%",
      }}
    >
      <div>
        <div sx={{ flex: "row", align: "center", gap: 8, mt: 8 }}>
          <Text fs={32}>
            {t("value.tokenWithSymbol", { value: removeValue, symbol })}
          </Text>
        </div>

        <Text fs={18} color="pink500" sx={{ mb: 20 }}>
          {t("value.percentage", { value })}
        </Text>
        {!isPositionMultiple && (
          <Controller
            name="value"
            control={form.control}
            render={({ field }) => (
              <RemoveLiquidityInput
                value={field.value}
                onChange={field.onChange}
                balance={t("value.tokenWithSymbol", {
                  value: totalValue,
                  symbol,
                })}
              />
            )}
          />
        )}

        <STradingPairContainer>
          <Text color="brightBlue300">
            {t("liquidity.remove.modal.receive")}
          </Text>
          <RemoveLiquidityReward
            id={id}
            name={name}
            symbol={symbol}
            amount={t("value.token", {
              value: tokensToGet,
            })}
          />
          {values && BN(values.lrnaToGet).gt(0) && (
            <RemoveLiquidityReward
              id={DEPOSIT_CLASS_ID}
              name={lrnaMeta.name}
              symbol={lrnaMeta.symbol}
              amount={t("value.token", {
                value: values.lrnaToGet,
              })}
            />
          )}
        </STradingPairContainer>
      </div>
      <Spacer size={6} />
      <FeeRange
        minFee={values?.minWithdrawalFee.multipliedBy(100)}
        currentFee={values?.withdrawalFee}
        lrnaFeeValue={
          !BN(values?.lrnaPayWith ?? 0).isZero()
            ? t("value.token", {
                value: values?.lrnaPayWith,
              })
            : undefined
        }
        assetFeeValue={t("value.token", {
          value: values?.tokensPayWith,
        })}
        assetSymbol={symbol}
      />

      {isFeeExceeded && (
        <div
          sx={{
            flex: "row",
            align: "center",
            gap: 8,
            minHeight: 50,
            p: "12px 14px",
            my: 6,
          }}
          css={{
            borderRadius: 2,
            background: "rgba(245, 168, 85, 0.3)",
          }}
        >
          <Icon size={24} icon={<IconWarning />} />

          <Text color="white" fs={13} fw={400}>
            {t("liquidity.remove.modal.fee.warning")}
          </Text>
        </div>
      )}

      <div>
        <Spacer size={20} />
        <Button
          fullWidth
          variant="primary"
          disabled={tokensToGet.isZero() || isFeeExceeded}
        >
          {t("liquidity.remove.modal.confirm")}
        </Button>
      </div>
    </form>
  )
}
