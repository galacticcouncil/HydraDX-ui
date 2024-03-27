import { css } from "@emotion/react"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { useEffect } from "react"
import { Web3ConnectFooter } from "sections/web3-connect/modal/Web3ConnectFooter"
import { WalletProviderType } from "sections/web3-connect/Web3Connect.utils"
import { Web3ConnectContent } from "sections/web3-connect/modal/Web3ConnectContent"
import {
  WalletMode,
  useWeb3ConnectStore,
} from "sections/web3-connect/store/useWeb3ConnectStore"

enum ModalPage {
  ProviderSelect,
  External,
  AccountSelect,
  Error,
  AddressBook,
}

export const Web3ConnectModal = () => {
  const {
    provider: activeProvider,
    account,
    disconnect,
    open,
    toggle,
    mode,
  } = useWeb3ConnectStore()

  const shouldShowProviderSelect =
    mode !== WalletMode.Default || !activeProvider || !account

  const initialPage = shouldShowProviderSelect
    ? ModalPage.ProviderSelect
    : ModalPage.AccountSelect

  const { page, direction, paginateTo } = useModalPagination(initialPage)

  useEffect(() => {
    return useWeb3ConnectStore.subscribe(({ status, provider, error }) => {
      const ixExternalProvider = provider === WalletProviderType.ExternalWallet

      const isConnected = status === "connected"
      const isDisconnected = status === "disconnected"
      const isPending = status === "pending"
      const isError = status === "error"

      if (isError && error) {
        return paginateTo(ModalPage.Error)
      }

      if (ixExternalProvider) {
        return paginateTo(ModalPage.External)
      }

      if (isConnected || isPending) {
        return paginateTo(ModalPage.AccountSelect)
      }

      if (isDisconnected) {
        return paginateTo(ModalPage.ProviderSelect)
      }
    })
  }, [paginateTo])

  const showFooter = activeProvider && page === ModalPage.AccountSelect

  return (
    <Modal
      open={open}
      disableCloseOutside
      onClose={toggle}
      css={css`
        --wallet-footer-height: 96px;
      `}
    >
      <Web3ConnectContent
        page={page}
        direction={direction}
        onBack={() =>
          paginateTo(page === ModalPage.AddressBook ? ModalPage.External : 0)
        }
        onClose={toggle}
        onSelect={() => paginateTo(ModalPage.AccountSelect)}
        onRetry={() => paginateTo(ModalPage.ProviderSelect)}
        onOpenAddressBook={() => paginateTo(ModalPage.AddressBook)}
        onCloseAddressBook={() => paginateTo(ModalPage.External)}
      />
      {showFooter && (
        <Web3ConnectFooter
          onSwitch={() => {
            paginateTo(0)
          }}
          onLogout={() => {
            disconnect()
            toggle()
          }}
        />
      )}
    </Modal>
  )
}
