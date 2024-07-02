import { InputBox } from "components/Input/InputBox"
import { FC } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { MemepadStep2Values } from "./MemepadForm.utils"

type MemepadFormStep2Props = {
  form: UseFormReturn<MemepadStep2Values>
}

export const MemepadFormStep2: FC<MemepadFormStep2Props> = ({ form }) => {
  const { t } = useTranslation()

  return (
    <form autoComplete="off">
      <div sx={{ flex: "column", gap: 8 }}>
        <Controller
          name="asset"
          control={form.control}
          render={({ field }) => (
            <InputBox
              label={t("wallet.addToken.form.assetToTransfer")}
              withLabel
              error={form.formState.errors.asset?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="address"
          control={form.control}
          render={({ field }) => (
            <InputBox
              label={t("wallet.addToken.form.hydrationAddress")}
              withLabel
              error={form.formState.errors.address?.message}
              {...field}
            />
          )}
        />
      </div>
    </form>
  )
}
