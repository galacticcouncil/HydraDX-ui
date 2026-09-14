import { LoadingButton } from "@galacticcouncil/ui/components"
import { FC, ReactNode } from "react"
import { useFormContext, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { TradeFormValues } from "@/modules/trade/swap/lib/useTradeForm"
import { maxBalanceError } from "@/utils/validators"

type Props = {
  readonly isEnabled: boolean
  readonly isLoading: boolean
  readonly disabledLabel?: ReactNode
  readonly children: ReactNode
}

/** Shared submit for swap tabs. Common blockers live here; tab-specific ones use `disabledLabel`. */
export const TradeFormSubmit: FC<Props> = ({
  isEnabled,
  isLoading,
  disabledLabel,
  children,
}) => {
  const { t } = useTranslation("trade")
  const { control, watch } = useFormContext<TradeFormValues>()
  const { errors } = useFormState({ control, name: "sellAmount" })
  const sellAmount = watch("sellAmount")

  const label = (() => {
    if (!sellAmount) return t("xc.swap.cta.enterAmount")
    if (errors.sellAmount?.message === maxBalanceError) {
      return t("xc.swap.cta.insufficientBalance")
    }
    if (!isEnabled) return disabledLabel ?? t("swap.cta.unavailable")
    return children
  })()

  return (
    <AuthorizedAction size="large" width="100%">
      <LoadingButton
        type="submit"
        size="large"
        width="100%"
        isLoading={isLoading}
        disabled={!isEnabled || isLoading}
        variant={isEnabled ? "primary" : "muted"}
        loadingVariant="muted"
        loadingMode={isEnabled ? "inline" : "replace"}
        sx={{ "&:disabled": { cursor: "auto", opacity: 1 } }}
      >
        {label}
      </LoadingButton>
    </AuthorizedAction>
  )
}
