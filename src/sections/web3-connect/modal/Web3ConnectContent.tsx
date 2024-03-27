import { ModalContents } from "components/Modal/contents/ModalContents"
import { useTranslation } from "react-i18next"
import {
  isEvmProvider,
  useWalletAccounts,
} from "sections/web3-connect/Web3Connect.utils"
import { Web3ConnectAccountList } from "sections/web3-connect/accounts/Web3ConnectAccountList"
import { Web3ConnectErrorModal } from "sections/web3-connect/modal/Web3ConnectErrorModal"
import { Web3ConnectExternalModal } from "sections/web3-connect/modal/Web3ConnectExternalModal"
import { Web3ConnectProviderPending } from "sections/web3-connect/providers/Web3ConnectProviderPending"
import { Web3ConnectProviders } from "sections/web3-connect/providers/Web3ConnectProviders"
import { useWeb3ConnectStore } from "sections/web3-connect/store/useWeb3ConnectStore"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { AddressBook } from "components/AddressBook/AddressBook"
import { useForm } from "react-hook-form"

type Props = {
  page: number
  direction?: number
  onClose: () => void
  onBack: () => void
  onSelect: () => void
  onRetry: () => void
  onOpenAddressBook: () => void
  onCloseAddressBook: () => void
}

export const Web3ConnectContent: React.FC<Props> = ({
  onSelect,
  onRetry,
  onOpenAddressBook,
  onCloseAddressBook,
  ...props
}) => {
  const { t } = useTranslation()
  const {
    provider: activeProvider,
    mode,
    status,
    disconnect,
    error,
    meta,
  } = useWeb3ConnectStore()

  const { data, isLoading } = useWalletAccounts(activeProvider)
  // Only show the first (active) account for EVM providers
  const accounts = isEvmProvider(activeProvider) ? data?.slice(0, 1) : data

  const isConnecting = isLoading || status === "pending"

  const chain = meta?.chain ? chainsMap.get(meta?.chain) : null

  const externalWalletForm = useForm<{
    address: string
    delegates: boolean
  }>()

  return (
    <ModalContents
      {...props}
      contents={[
        {
          title: t("walletConnect.provider.title"),
          content: <Web3ConnectProviders />,
          description:
            chain && mode === "evm"
              ? t(`walletConnect.provider.description.evmChain`, {
                  chain: chain.name,
                })
              : chain && mode === "substrate"
              ? t(`walletConnect.provider.description.substrateChain`, {
                  chain: chain.name,
                })
              : t(`walletConnect.provider.description.${mode || "all"}`),
        },
        {
          title: t("walletConnect.provider.title"),
          content: (
            <Web3ConnectExternalModal
              form={externalWalletForm}
              onClose={props.onClose}
              onSelect={onSelect}
              onOpenAddressBook={onOpenAddressBook}
            />
          ),
        },
        {
          title: t("walletConnect.accountSelect.title"),
          description: t("walletConnect.accountSelect.description"),
          content:
            activeProvider && isConnecting ? (
              <Web3ConnectProviderPending provider={activeProvider} />
            ) : (
              <Web3ConnectAccountList accounts={accounts} />
            ),
        },
        {
          title: t("walletConnect.provider.title"),
          content: (
            <Web3ConnectErrorModal
              message={error}
              onRetry={() => {
                disconnect()
                onRetry?.()
              }}
            />
          ),
        },
        {
          title: t("addressbook.title"),
          content: (
            <AddressBook
              onSelect={(address) => {
                externalWalletForm.setValue("address", address)
                onCloseAddressBook?.()
              }}
            />
          ),
        },
      ]}
    />
  )
}
