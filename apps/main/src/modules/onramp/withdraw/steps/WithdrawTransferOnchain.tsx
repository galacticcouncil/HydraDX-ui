import {
  AccountInput,
  Alert,
  AssetInput,
  Flex,
  FormLabel,
  LoadingButton,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Text,
  Toggle,
} from "@galacticcouncil/ui/components"
import { useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAccountBalances } from "@/api/balances"
import { AssetLogo } from "@/components/AssetLogo"
import { useWithdraw } from "@/modules/onramp/withdraw/hooks/useWithdraw"
import { useTransferPosition } from "@/modules/portfolio/overview/Transfer/TransferPosition.form"
import { useSubmitTransferPosition } from "@/modules/portfolio/overview/Transfer/TransferPositionModal.submit"
import { useAssets } from "@/providers/assetsProvider"
import { toDecimal } from "@/utils/formatting"

export type WithdrawTransferOnchainProps = {
  onTransferSuccess: () => void
  onBack: () => void
}

export const WithdrawTransferOnchain: React.FC<
  WithdrawTransferOnchainProps
> = ({ onTransferSuccess, onBack }) => {
  const { t } = useTranslation(["onramp", "common", "xcm", "wallet"])
  const { asset, cexId, setAmount: setWithdrawnAmount } = useWithdraw()
  const { getAsset } = useAssets()
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const { getTransferableBalance } = useAccountBalances()
  const assetMeta = asset ? getAsset(asset.assetId) : null

  const { form } = useTransferPosition({ assetId: assetMeta?.id })
  const { mutate: transfer, isPending: isSubmitting } =
    useSubmitTransferPosition({
      onSuccess: () => {
        setWithdrawnAmount(form.getValues("amount"))
        onTransferSuccess()
      },
    })

  const maxBalance = assetMeta
    ? toDecimal(getTransferableBalance(assetMeta.id), assetMeta.decimals)
    : 0n

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("withdraw.cex.transfer.title", {
          cex: t(`cex.${cexId}.title`),
        })}
        onBack={onBack}
        align="center"
        closable={false}
      />
      <ModalBody>
        <form
          onSubmit={form.handleSubmit((values) => {
            return transfer(values)
          })}
        >
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssetInput
                label={t("common:asset")}
                value={field.value}
                asset={
                  assetMeta
                    ? {
                        symbol: assetMeta.symbol,
                        icon: <AssetLogo id={asset?.assetId ?? ""} />,
                      }
                    : null
                }
                onChange={field.onChange}
                balance={{
                  label: t("common:balance"),
                  value: t("common:number", { value: maxBalance.toString() }),
                  onMax: () => field.onChange(maxBalance.toString()),
                  isMaxDisabled: !(Number(maxBalance.toString()) > 0),
                }}
                amountError={fieldState.error?.message}
              />
            )}
          />
          <ModalContentDivider my="xl" />
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Flex direction="column" gap="m">
                <FormLabel asChild>
                  <label htmlFor={field.name}>
                    {t("wallet:transfer.modal.address.label")}
                  </label>
                </FormLabel>
                <AccountInput
                  id={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("withdraw.transfer.destination.placeholder")}
                  isError={!!fieldState.error}
                />
              </Flex>
            )}
          />
          <ModalContentDivider sx={{ my: "xl" }} />
          <Alert
            variant="warning"
            description={t("withdraw.disclaimer.cex.title", {
              cex: t(`cex.${cexId}.title`),
              symbol: asset?.data.asset.originSymbol,
            })}
            action={
              <Flex as="label" gap="base" align="center">
                <Toggle
                  size="large"
                  checked={disclaimerAccepted}
                  onCheckedChange={setDisclaimerAccepted}
                />
                <Text fs="p4" lh={1.3} fw={600}>
                  {t("withdraw.disclaimer.cex.description", {
                    cex: t(`cex.${cexId}.title`),
                    symbol: asset?.data.asset.originSymbol,
                  })}
                </Text>
              </Flex>
            }
          />

          <ModalContentDivider sx={{ my: "xl" }} />
          <LoadingButton
            type="submit"
            size="large"
            variant="primary"
            width="100%"
            disabled={!disclaimerAccepted || isSubmitting}
            isLoading={isSubmitting}
          >
            {t("withdraw.transfer.button")}
          </LoadingButton>
        </form>
      </ModalBody>
    </FormProvider>
  )
}
