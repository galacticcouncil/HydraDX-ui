import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import Big from "big.js"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { refine, z } from "zod/v4"

import { positive, required, validateFieldMaxBalance } from "@/utils/validators"

export type DepositFormValues = {
  amount: string
}

const defaultValues: DepositFormValues = {
  amount: "",
}

type UseDepositFormParams = {
  maxBalance: string
  maxCapacity: number
}

export const useDepositForm = ({
  maxBalance,
  maxCapacity,
}: UseDepositFormParams) => {
  const { t } = useTranslation("propeller")

  const schema = z.object({
    amount: required
      .pipe(positive)
      .check(validateFieldMaxBalance(maxBalance))
      .check(
        refine<string>(
          (value) =>
            !Number.isFinite(maxCapacity) || Big(value || "0").lte(maxCapacity),
          { error: t("deposit.cta.exceedsCapacity") },
        ),
      ),
  })

  return useForm<DepositFormValues>({
    defaultValues,
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
  })
}
