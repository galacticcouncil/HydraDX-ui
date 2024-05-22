import { InputBox } from "components/Input/InputBox"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { Modal } from "components/Modal/Modal"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  FormFields,
  useCreateAssetId,
  useCreateToken,
  useZodCreateToken,
} from "./CreateToken.utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "components/Button/Button"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"

export const CreateTokenModal = ({ onClose }: { onClose: () => void }) => {
  const { account } = useAccount()
  const { t } = useTranslation()
  const createToken = useCreateToken()
  const zodSchema = useZodCreateToken()
  const id = useCreateAssetId()

  const form = useForm<FormFields>({
    mode: "onChange",
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
    values: {
      name: "",
      symbol: "",
      decimals: "",
      deposit: "",
      id: id?.toString() ?? "",
    },
  })

  const onSubmit = async (values: FormFields) => {
    createToken.mutate(values)
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
                    render={({ field, fieldState: { error } }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.name")}
                        {...field}
                        label={t("wallet.addToken.form.name")}
                        withLabel
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="symbol"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.symbol")}
                        {...field}
                        label={t("wallet.addToken.form.symbol")}
                        withLabel
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="decimals"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <InputBox
                        placeholder={t("wallet.addToken.form.decimals")}
                        {...field}
                        label={t("wallet.addToken.form.decimals")}
                        withLabel
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="deposit"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <InputBox
                        placeholder="Minimum balance"
                        {...field}
                        label="Minimum balance"
                        withLabel
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="id"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <InputBox
                        placeholder="Asset id"
                        {...field}
                        value={id?.toString() ?? ""}
                        disabled
                        label="Asset id"
                        withLabel
                        error={error?.message}
                      />
                    )}
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!account || account.isExternalWalletConnected}
                  >
                    Create token
                  </Button>
                </div>
              </form>
            ),
          },
        ]}
      />
    </Modal>
  )
}
