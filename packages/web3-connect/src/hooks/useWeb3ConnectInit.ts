import { useEffect, useRef, useState } from "react"

import { isModalPage, Web3ConnectModalPage } from "@/config/modal"
import { useWeb3Connect, WalletProviderStatus } from "@/hooks/useWeb3Connect"

/** These drive their own navigation; a connection must not yank the user off them. */
const MULTISIG_PAGES: Web3ConnectModalPage[] = [
  Web3ConnectModalPage.MultisigSetup,
  Web3ConnectModalPage.MultisigConfigSelect,
  Web3ConnectModalPage.MultisigSignerSelect,
]

/**
 * Which screen the modal opens on, and the one transition it makes on its own:
 * connecting or fully disconnecting a wallet returns to the wallets screen.
 *
 * Connection state is not a page. `WalletManagementContent` derives what to
 * show - accounts, an error, a connecting spinner - from the store directly.
 */
export const useWeb3ConnectInit = ({
  initialPage,
}: {
  initialPage?: Web3ConnectModalPage
}) => {
  const [page, setPage] = useState<Web3ConnectModalPage>(() =>
    isModalPage(initialPage) ? initialPage : Web3ConnectModalPage.Wallets,
  )

  const pageRef = useRef(page)
  useEffect(() => {
    pageRef.current = page
  }, [page])

  useEffect(() => {
    return useWeb3Connect.subscribe(
      ({ recentProvider, getStatus, providers }) => {
        if (MULTISIG_PAGES.includes(pageRef.current)) return

        const status = getStatus(recentProvider)
        const isConnecting =
          status === WalletProviderStatus.Connected ||
          status === WalletProviderStatus.Pending
        const isFullyDisconnected =
          status === WalletProviderStatus.Disconnected && providers.length === 0

        if (isConnecting || isFullyDisconnected) {
          setPage(Web3ConnectModalPage.Wallets)
        }
      },
    )
  }, [])

  return { page, setPage }
}
