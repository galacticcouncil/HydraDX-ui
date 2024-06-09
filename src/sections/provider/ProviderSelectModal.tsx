import { PROVIDERS, useProviderRpcUrlStore } from "api/provider"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Fragment, useState } from "react"

import { SContainer, SHeader } from "./ProviderSelectModal.styled"
import { useTranslation } from "react-i18next"
import { Controller, useForm } from "react-hook-form"
import { ProviderInput } from "./components/ProviderInput/ProviderInput"
import { useRpcStore } from "state/store"
import { FormValues } from "utils/helpers"
import { useMutation } from "@tanstack/react-query"
import { connectWsProvider } from "./ProviderSelectModal.utils"
import { ProviderItem } from "./components/ProviderItem/ProviderItem"
import { DeleteModal } from "./components/DeleteModal/DeleteModal"
import { SubstrateApis } from "@galacticcouncil/xcm-core"

export function ProviderSelectModal(props: {
  open: boolean
  onClose: () => void
}) {
  const preference = useProviderRpcUrlStore()
  const activeRpcUrl = preference.rpcUrl ?? import.meta.env.VITE_PROVIDER_URL
  const [userRpcUrl, setUserRpcUrl] = useState(activeRpcUrl)
  const [removeRpcUrl, setRemoveRpcUrl] = useState<string | undefined>()
  const { t } = useTranslation()
  const { rpcList, addRpc, removeRpc } = useRpcStore()

  const form = useForm<{ address: string }>({
    defaultValues: { address: "wss://" },
    mode: "onChange",
  })

  const mutation = useMutation(async (value: FormValues<typeof form>) => {
    try {
      const provider = await connectWsProvider(value.address)

      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(provider.endpoint)

      const relay = await api.query.parachainSystem.validationData()
      const relayParentNumber = relay.unwrap().relayParentNumber

      if (relayParentNumber.toNumber()) {
        addRpc(value.address)
        form.reset()
      }
    } catch (e) {
      if (e === "disconnected")
        form.setError("address", {
          message: t("rpc.change.modal.errors.notExist"),
        })
      throw new Error(t("rpc.change.modal.errors.notExist"))
    }
  })

  return (
    <>
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t("rpc.change.modal.title")}
      >
        <>
          <form onSubmit={form.handleSubmit((a) => mutation.mutate(a))}>
            <Controller
              name="address"
              control={form.control}
              rules={{
                required: t("wallet.assets.transfer.error.required"),
                validate: {
                  duplicate: (value) => {
                    const isDuplicate = rpcList.find(
                      (rpc) => rpc.url === `wss://${value}`,
                    )
                    return (
                      !isDuplicate || t("rpc.change.modal.errors.duplicate")
                    )
                  },
                },
              }}
              render={({
                field: { name, value, onChange },
                fieldState: { error },
              }) => (
                <ProviderInput
                  name={name}
                  value={value}
                  onChange={onChange}
                  error={error?.message}
                  button={
                    <Button
                      size="small"
                      type="submit"
                      isLoading={mutation.isLoading}
                    >
                      {t("add")}
                    </Button>
                  }
                />
              )}
            />
          </form>

          <SContainer>
            <SHeader>
              <div css={{ gridArea: "name" }}>
                {t("rpc.change.modal.column.name")}
              </div>
              <div css={{ gridArea: "status" }}>
                {t("rpc.change.modal.column.status")}
              </div>
              <div css={{ gridArea: "url" }} sx={{ textAlign: "right" }}>
                {t("rpc.change.modal.column.rpc")}
              </div>
            </SHeader>

            {PROVIDERS.filter((provider) =>
              typeof provider.env === "string"
                ? provider.env === import.meta.env.VITE_ENV
                : provider.env.includes(import.meta.env.VITE_ENV),
            ).map((provider, index) => {
              return (
                <Fragment key={provider.url}>
                  <ProviderItem
                    name={provider.name}
                    url={provider.url}
                    isActive={provider.url === userRpcUrl}
                    onClick={() => setUserRpcUrl(provider.url)}
                  />
                  {index + 1 < PROVIDERS.length && (
                    <Separator color="alpha0" opacity={0.06} />
                  )}
                </Fragment>
              )
            })}

            {rpcList?.map((rpc, index) => (
              <Fragment key={rpc.url}>
                <ProviderItem
                  name={
                    rpc.name ??
                    t("rpc.change.modal.name.label", { index: index + 1 })
                  }
                  url={rpc.url}
                  isActive={rpc.url === userRpcUrl}
                  onClick={() => setUserRpcUrl(rpc.url)}
                  custom
                  onRemove={(rpc) => {
                    setRemoveRpcUrl(rpc)
                  }}
                />
                {index + 1 < PROVIDERS.length && (
                  <Separator color="alpha0" opacity={0.06} />
                )}
              </Fragment>
            ))}
          </SContainer>

          <Button
            variant="primary"
            fullWidth
            sx={{ mt: 64 }}
            onClick={() => {
              preference.setRpcUrl(userRpcUrl)

              if (activeRpcUrl !== userRpcUrl) {
                window.location.reload()
              } else {
                props.onClose()
              }
            }}
          >
            {t("rpc.change.modal.save")}
          </Button>
        </>
        {!!removeRpcUrl && (
          <DeleteModal
            onBack={() => setRemoveRpcUrl(undefined)}
            onConfirm={() => {
              removeRpc(removeRpcUrl)
              setRemoveRpcUrl(undefined)
            }}
          />
        )}
      </Modal>
    </>
  )
}
