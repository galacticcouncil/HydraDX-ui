import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"
import { useNavigate } from "@tanstack/react-location"
import { getDelegates } from "api/proxies"
import CrossIcon from "assets/icons/CrossIcon.svg?react"
import { Button } from "components/Button/Button"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { useRpcProvider } from "providers/rpcProvider"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  CloseIcon,
  PasteAddressIcon,
} from "sections/wallet/transfer/onchain/WalletTransferSectionOnchain.styled"
import {
  WalletProviderType,
  getWalletProviderByType,
  useWallet,
} from "sections/web3-connect/Web3Connect.utils"
import { useWeb3ConnectStore } from "sections/web3-connect/store/useWeb3ConnectStore"
import { ExternalWallet } from "sections/web3-connect/wallets/ExternalWallet"
import { HYDRA_ADDRESS_PREFIX, POLKADOT_APP_NAME } from "utils/api"
import { H160, safeConvertAddressH160 } from "utils/evm"
import { getAddressVariants, safeConvertAddressSS58 } from "utils/formatting"
import { FormValues } from "utils/helpers"
import { WalletTransferAccountInput } from "sections/wallet/transfer/WalletTransferAccountInput"

type ExternalWalletConnectModalProps = {
  form: UseFormReturn<{
    address: string
    delegates: boolean
  }>
  onClose: () => void
  onSelect: () => void
  onOpenAddressBook?: () => void
}

export const Web3ConnectExternalModal = ({
  form,
  onClose,
  onSelect,
  onOpenAddressBook,
}: ExternalWalletConnectModalProps) => {
  const { api } = useRpcProvider()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { setAccount } = useWeb3ConnectStore()

  const { wallet: activeWallet } = useWallet()
  const externalWallet =
    activeWallet instanceof ExternalWallet ? activeWallet : null

  // means that a user already knows that he doesn't have delegates
  const isDelegatesError = form.formState.errors.delegates

  const onSubmit = async (values: FormValues<typeof form>) => {
    if (!externalWallet) return

    const isEvm = safeConvertAddressH160(values.address) !== null
    const address = isEvm
      ? new H160(values.address).toAccount()
      : values.address

    const { isProxy, delegates } = await getDelegates(api, address)

    let isDelegate = false

    if (isProxy) {
      const { wallet: proxyWallet } = getWalletProviderByType(
        externalWallet.proxyWalletProvider,
      )

      if (proxyWallet?.installed) {
        await proxyWallet?.enable(POLKADOT_APP_NAME)
        const accounts = await proxyWallet?.getAccounts()

        isDelegate = accounts?.some((account) =>
          delegates.find(
            (delegate) =>
              delegate ===
              encodeAddress(
                decodeAddress(account.address),
                HYDRA_ADDRESS_PREFIX,
              ),
          ),
        )
      }
    }

    if (isProxy && !isDelegate && !isDelegatesError) {
      form.setError("delegates", {})
      return
    }

    externalWallet.setAddress(address)

    const evmAddress = isEvm ? safeConvertAddressH160(values.address) ?? "" : ""
    const hydraAddress = !isEvm
      ? getAddressVariants(values.address)?.hydraAddress ?? ""
      : ""
    setAccount({
      address,
      displayAddress: isEvm ? evmAddress : hydraAddress,
      name:
        delegates.length && isDelegate
          ? externalWallet.proxyAccountName
          : externalWallet.accountName,
      provider: WalletProviderType.ExternalWallet,
      isExternalWalletConnected: true,
    })
    onSelect()
    navigate({
      search: { account: evmAddress ? evmAddress.slice(2) : address },
      fromCurrent: true,
    })

    if (!delegates.length || (delegates.length && isDelegatesError)) {
      onClose()
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      autoComplete="off"
      sx={{ flex: "column", minHeight: "100%" }}
    >
      <Text color="basic400">
        {t("walletConnect.externalWallet.modal.desc")}
      </Text>
      <Controller
        name="address"
        control={form.control}
        rules={{
          required: t("wallet.assets.transfer.error.required"),
          validate: {
            validAddress: (value) =>
              safeConvertAddressSS58(value, 0) !== null ||
              safeConvertAddressH160(value) !== null ||
              t("wallet.assets.transfer.error.validAddress"),
          },
        }}
        render={({
          field: { name, value, onChange },
          fieldState: { error },
        }) => {
          const rightIcon = value ? (
            <CloseIcon
              icon={<CrossIcon />}
              onClick={() => {
                onChange("")
                form.clearErrors("delegates")
              }}
              name={t("modal.closeButton.name")}
            />
          ) : (
            <PasteAddressIcon
              onClick={async () => {
                const text = await navigator.clipboard.readText()
                onChange(text)
                form.clearErrors("delegates")
              }}
            />
          )

          return (
            <div sx={{ mt: 35 }}>
              <WalletTransferAccountInput
                label={t("walletConnect.externalWallet.modal.input.label")}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={t(
                  "walletConnect.externalWallet.modal.input.placeholder",
                )}
                rightIcon={rightIcon}
                error={error?.message}
                openAddressBook={onOpenAddressBook}
              />
            </div>
          )
        }}
      />
      <Controller
        name="delegates"
        control={form.control}
        render={({ fieldState: { error } }) =>
          error ? (
            <>
              <Spacer size={15} />
              <Text color="red400" font="ChakraPetchBold" fs={12}>
                {t("walletConnect.accountSelect.proxyAccount.error")}
              </Text>
              <Spacer size={6} />
              <Text fw={400} color="red400" fs={12}>
                {t("walletConnect.accountSelect.proxyAccount.errorDesc")}
              </Text>
            </>
          ) : (
            <div />
          )
        }
      />

      <Spacer size={35} />
      <Button
        disabled={!!form.formState.errors.address}
        variant="primary"
        type="submit"
        sx={{ mt: "auto" }}
      >
        {form.formState.errors.delegates
          ? t("walletConnect.accountSelect.viewAsWallet")
          : t("confirm")}
      </Button>
    </form>
  )
}
