import {
  AccountInput,
  Alert,
  AssetInput,
  Flex,
  FormError,
  FormLabel,
  LoadingButton,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Text,
  Toggle,
} from "@galacticcouncil/ui/components"
import {
  HYDRATION_CHAIN_KEY,
  isEvmParachain,
  isEvmParachainAccount,
} from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { chainsMap } from "@galacticcouncil/xc-cfg"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCrossChainWallet, xcmTransferQuery } from "@/api/xcm"
import { AssetLogo } from "@/components/AssetLogo"
import { useSubmitCexWithdraw } from "@/modules/onramp/withdraw/hooks/useSubmitCexWithdraw"
import { useWithdraw } from "@/modules/onramp/withdraw/hooks/useWithdraw"
import { useXcmForm } from "@/modules/xcm/transfer/hooks/useXcmForm"
import { useAssets } from "@/providers/assetsProvider"
import { toDecimal } from "@/utils/formatting"

export type WithdrawTransferProps = {
  onTransferSuccess: () => void
  onBack: () => void
}

export const WithdrawTransfer: React.FC<WithdrawTransferProps> = ({
  onTransferSuccess,
  onBack,
}) => {
  const { t } = useTranslation(["onramp", "common", "xcm", "wallet"])
  const { account } = useAccount()
  const { asset, cexId, setAmount: setWithdrawnAmount } = useWithdraw()
  const { getAsset } = useAssets()
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  const address = account?.address ?? ""
  const destChainKey = asset?.withdrawalChain ?? ""
  const assetKey = asset?.data?.asset?.key ?? ""
  const assetMeta = asset ? getAsset(asset.assetId) : null

  const srcChain = chainsMap.get(HYDRATION_CHAIN_KEY)
  const destChain = chainsMap.get(destChainKey)

  const wallet = useCrossChainWallet()
  const { data: transfer, isLoading: isLoadingTransfer } = useQuery(
    xcmTransferQuery(wallet, {
      srcChain: HYDRATION_CHAIN_KEY,
      srcAsset: assetKey,
      destChain: destChainKey,
      destAsset: assetKey,
      srcAddress: address,
      destAddress: address,
    }),
  )

  const transferData = useMemo(() => {
    if (!transfer)
      return {
        balance: 0n,
        min: 0n,
        max: 0n,
        symbol: "",
        decimals: 0,
      }

    const { balance, min, max } = transfer.source

    return {
      symbol: balance.symbol,
      decimals: balance.decimals,
      balance: balance.amount,
      min: min.amount,
      max: max.amount,
    }
  }, [transfer])

  const form = useXcmForm(transfer ?? null, {
    syncWithQueryParams: false,
    defaultValues: {
      srcChain: srcChain ?? null,
      destChain: destChain ?? null,
      srcAsset: asset?.data.asset ?? null,
      destAsset: asset?.data.asset ?? null,
    },
  })

  const { mutate: submitTx, isPending } = useSubmitCexWithdraw({
    asset: asset?.data.asset ?? null,
    cexId,
    onSuccess: () => {
      setWithdrawnAmount(form.getValues("srcAmount"))
      onTransferSuccess()
    },
  })

  const isAccountAllowed = isEvmParachainAccount(address)
    ? !!destChain && isEvmParachain(destChain)
    : true

  return (
    <>
      <ModalHeader
        title={t("withdraw.cex.transfer.title", {
          cex: t(`cex.${cexId}.title`),
        })}
        onBack={onBack}
        align="center"
        closable={false}
      />
      <ModalBody>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(
              (values) => transfer && submitTx([values, transfer]),
            )}
          >
            <Controller
              name="srcAmount"
              control={form.control}
              render={({ field, fieldState }) => (
                <AssetInput
                  isDisabled={!isAccountAllowed}
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
                  isLoading={isLoadingTransfer}
                  amountError={fieldState.error?.message}
                  balance={{
                    label: t("common:balance"),
                    value: t("common:number", {
                      value: toDecimal(
                        transferData.balance,
                        transferData.decimals,
                      ),
                    }),
                    onMax: () =>
                      field.onChange(
                        toDecimal(transferData.max, transferData.decimals),
                      ),
                    isMaxDisabled: !(Number(transferData.max) > 0),
                  }}
                />
              )}
            />
            <ModalContentDivider my="xl" />
            <Controller
              name="destAddress"
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
                  {fieldState.error && (
                    <FormError>{fieldState.error?.message}</FormError>
                  )}
                </Flex>
              )}
            />
            <ModalContentDivider sx={{ my: "xl" }} />
            {isAccountAllowed ? (
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
            ) : (
              <Alert
                variant="error"
                description={t("withdraw.cex.account.evmError", {
                  symbol: asset?.data.asset.originSymbol,
                })}
              />
            )}
            <ModalContentDivider sx={{ my: "xl" }} />
            <LoadingButton
              type="submit"
              size="large"
              variant="primary"
              width="100%"
              disabled={
                isLoadingTransfer ||
                !isAccountAllowed ||
                !disclaimerAccepted ||
                isPending
              }
              isLoading={isLoadingTransfer || isPending}
            >
              {t("withdraw.transfer.button")}
            </LoadingButton>
          </form>
        </FormProvider>
      </ModalBody>
    </>
  )
}
