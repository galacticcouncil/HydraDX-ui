import { InputBox } from "components/Input/InputBox"
import { FC } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { MemepadStep3Values } from "./MemepadForm.utils"

type MemepadFormStep3Props = {
  form: UseFormReturn<MemepadStep3Values>
}

export const MemepadFormStep3: FC<MemepadFormStep3Props> = ({ form }) => {
  const { t } = useTranslation()

  return (
    <form autoComplete="off">
      <div sx={{ flex: "column", gap: 8 }}>
        <Controller
          name="assetA"
          control={form.control}
          render={({ field }) => (
            <InputBox
              label={t("liquidity.pool.xyk.amountA")}
              withLabel
              error={form.formState.errors.assetA?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="assetB"
          control={form.control}
          render={({ field }) => (
            <InputBox
              label={t("liquidity.pool.xyk.amountB")}
              withLabel
              error={form.formState.errors.assetB?.message}
              {...field}
            />
          )}
        />
      </div>
    </form>
  )
}
