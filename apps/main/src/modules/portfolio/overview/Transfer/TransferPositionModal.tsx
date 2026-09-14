import { HealthFactorRiskWarning } from "@galacticcouncil/money-market/components"
import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import {
  Alert,
  Box,
  Button,
  Flex,
  LoadingButton,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Summary,
  SummaryRow,
  Text,
  Toggle,
} from "@galacticcouncil/ui/components"
import {
  normalizeSS58Address,
  safeConvertSS58toPublicKey,
  stringEquals,
} from "@galacticcouncil/utils"
import {
  AddressBookModal,
  useAccount,
  useAddresses,
  useAddressStore,
  WalletMode,
} from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import { FC, useEffect, useState } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { healthFactorAfterWithdrawQuery } from "@/api/aave"
import { AddressBookFormField } from "@/form/AddressBookFormField"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  TransferPositionFormValues,
  useTransferPosition,
} from "@/modules/portfolio/overview/Transfer/TransferPosition.form"
import { useSubmitTransferPosition } from "@/modules/portfolio/overview/Transfer/TransferPositionModal.submit"
import { isErc20AToken, useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

type Props = {
  readonly assetId?: string
  readonly onClose: () => void
}

export const TransferPositionModal: FC<Props> = ({ assetId, onClose }) => {
  const { t } = useTranslation(["wallet", "common"])
  const { account } = useAccount()
  const { tradable, native } = useAssets()

  const transferPosition = useSubmitTransferPosition({ onClose })
  const { form, getMaxBalance } = useTransferPosition({ assetId })
  const shouldValidate = form.formState.isSubmitted

  const [isMyContactsOpen, setIsMyContactsOpen] = useState(false)

  const [asset, amount, address] = form.watch(["asset", "amount", "address"])

  const { data: healthFactor } = useQuery(
    healthFactorAfterWithdrawQuery(useRpcProvider(), {
      address: account?.address ?? "",
      fromAssetId: asset && isErc20AToken(asset) ? asset.underlyingAssetId : "",
      fromAmount: amount,
    }),
  )

  const [cexDisclaimerAccepted, setCexDisclaimerAccepted] = useState(false)
  const [healthFactorRiskAccepted, setHealthFactorRiskAccepted] =
    useState(false)

  const { watch } = form
  useEffect(() => {
    const subscription = watch((_, { type }) => {
      if (type !== "change") {
        return
      }

      setHealthFactorRiskAccepted(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch])

  const { add: addAddressToAddressBook } = useAddressStore()
  const userOwnedAddresses = useAddresses()

  const addCustomRecipient = (recipient: string) => {
    addAddressToAddressBook({
      address: recipient,
      name: "",
      isCustom: true,
    })
  }

  const isUserOwnedAddress = userOwnedAddresses.some(({ publicKey }) =>
    stringEquals(
      publicKey,
      safeConvertSS58toPublicKey(normalizeSS58Address(address)),
    ),
  )

  const isNonNativeAsset = asset && asset.id !== native.id
  const shouldShowCexDisclaimer =
    isNonNativeAsset && form.formState.isValid && !isUserOwnedAddress

  const isHealthFactorCheckSatisfied = healthFactor?.isUserConsentRequired
    ? healthFactorRiskAccepted
    : true

  const isCexDisclaimerSatisfied = shouldShowCexDisclaimer
    ? cexDisclaimerAccepted
    : true

  if (isMyContactsOpen) {
    return (
      <AddressBookModal
        whitelist={[WalletMode.Substrate, WalletMode.EVM]}
        onBack={() => setIsMyContactsOpen(false)}
        onSelect={(address) => {
          form.setValue("address", address.address, { shouldValidate })
          setIsMyContactsOpen(false)
        }}
      />
    )
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          addCustomRecipient(values.address)
          transferPosition.mutate(values)
        })}
      >
        <ModalHeader align="center" title={t("transfer.modal.title")} />
        <ModalBody sx={{ py: 0 }}>
          <ModalContentDivider />
          <Box py="l" width="100%">
            <AssetSelectFormField<TransferPositionFormValues>
              label={t("transfer.modal.asset.label")}
              assetFieldName="asset"
              amountFieldName="amount"
              balance={{ value: getMaxBalance(asset) }}
              assets={tradable}
            />
          </Box>
          <ModalContentDivider />
          <AddressBookFormField<TransferPositionFormValues>
            fieldName="address"
            onOpenMyContacts={() => setIsMyContactsOpen(true)}
          />

          {healthFactor?.isSignificantChange && (
            <Summary separator={<ModalContentDivider />} withLeadingSeparator>
              <SummaryRow
                label={t("common:healthFactor")}
                content={<HealthFactorChange {...healthFactor} />}
              />
            </Summary>
          )}
          <ModalContentDivider />
        </ModalBody>
        <ModalFooter
          display="grid"
          sx={{
            justifyContent: "space-between",
            flexDirection: "row",
            gridTemplateColumns: "1fr",
            gap: "xl",
          }}
        >
          {healthFactor && (
            <HealthFactorRiskWarning
              message={t("common:healthFactor.warning")}
              accepted={healthFactorRiskAccepted}
              onAcceptedChange={setHealthFactorRiskAccepted}
              isUserConsentRequired={healthFactor.isUserConsentRequired}
            />
          )}
          {isNonNativeAsset && (
            <Alert
              variant="warning"
              description={t("transfer.modal.warning.nonNative")}
              action={
                shouldShowCexDisclaimer && (
                  <Flex as="label" gap="base" align="center">
                    <Toggle
                      size="large"
                      checked={cexDisclaimerAccepted}
                      onCheckedChange={setCexDisclaimerAccepted}
                    />
                    <Text fs="p4" lh={1.3} fw={600}>
                      {t("transfer.modal.acceptance.cex")}
                    </Text>
                  </Flex>
                )
              }
            />
          )}
          <Button
            size="large"
            variant="tertiary"
            display={[null, "none"]}
            onClick={onClose}
          >
            {t("common:cancel")}
          </Button>
          <LoadingButton
            isLoading={transferPosition.isPending}
            size="large"
            type="submit"
            disabled={
              !isHealthFactorCheckSatisfied ||
              !isCexDisclaimerSatisfied ||
              !form.formState.isValid
            }
          >
            {t("common:confirm")}
          </LoadingButton>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}
