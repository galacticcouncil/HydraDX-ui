import { InputBox } from "components/Input/InputBox"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { Modal } from "components/Modal/Modal"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormValues } from "utils/helpers"

type FormFields = {
  id: string
  name: string
  decimals: string
  symbol: string
  deposit: string
}

export const CreateTokenModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const form = useForm<FormFields>({
    mode: "onSubmit",
    // defaultValues: {
    //   name: asset.name,
    //   symbol: asset.symbol,
    //   decimals: asset.decimals.toString(),
    //   multilocation: asset.origin ? PARACHAIN_CONFIG[asset.origin] : {},
    // },
  })

  const onSubmit = async (values: FormValues<typeof form>) => {
    onClose()
  }

  return (
    <Modal open disableCloseOutside onClose={onClose}>
      <ModalContents
        onClose={onClose}
        contents={[
          {
            title: "Add Token",
            headerVariant: "FontOver",
            content: (
              <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
                <div sx={{ flex: "column", gap: 8, height: "100%" }}>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.name")}
                        {...field}
                        disabled={false}
                        label={t("wallet.addToken.form.name")}
                        withLabel
                      />
                    )}
                  />
                  <Controller
                    name="symbol"
                    control={form.control}
                    render={({ field }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.symbol")}
                        {...field}
                        disabled={false}
                        label={t("wallet.addToken.form.symbol")}
                        withLabel
                      />
                    )}
                  />
                  <Controller
                    name="decimals"
                    control={form.control}
                    render={({ field }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.decimals")}
                        {...field}
                        disabled={false}
                        label={t("wallet.addToken.form.decimals")}
                        withLabel
                      />
                    )}
                  />
                  <Controller
                    name="deposit"
                    control={form.control}
                    render={({ field }) => (
                      <InputBox
                        placeholder="Minimum balance"
                        {...field}
                        disabled={false}
                        label="Minimum balance"
                        withLabel
                      />
                    )}
                  />
                  <Controller
                    name="id"
                    control={form.control}
                    render={({ field }) => (
                      <InputBox
                        placeholder="Asset id"
                        {...field}
                        disabled={false}
                        label="Asset id"
                        withLabel
                      />
                    )}
                  />
                </div>
              </form>
            ),
          },
        ]}
      />
    </Modal>
  )
}
