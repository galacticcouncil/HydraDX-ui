import { hydration } from "@galacticcouncil/descriptors"
import { NeckworkClient } from "@galacticcouncil/indexer/neckwork"
import { TypedApi } from "polkadot-api"
import { createContext, useContext, useMemo } from "react"

import { Web3ConnectModalPage } from "@/config/modal"
import { Account, WalletMode } from "@/hooks/useWeb3Connect"

export type AccountBalancesState = {
  accountBalances: ReadonlyMap<string, number>
  isLoading: boolean
}

export type UseExtraAccountBalances = (
  accounts: readonly Account[],
) => AccountBalancesState

export const useEmptyExtraAccountBalances: UseExtraAccountBalances = () => {
  const accountBalances = useMemo(() => new Map<string, number>(), [])

  return {
    accountBalances,
    isLoading: false,
  }
}

export type Web3ConnectContextType = {
  isControlled: boolean
  page: Web3ConnectModalPage
  setPage: (page: Web3ConnectModalPage) => void
  neckwork: NeckworkClient
  papi: TypedApi<typeof hydration>
  onAccountSelect: (account: Account) => void
  mode: WalletMode
  // ponytail: optional so the old Web3ConnectModal keeps compiling without
  // supplying them; the V2 modal wires useExtraAccountBalances (defaulting to
  // useEmptyExtraAccountBalances) and setModalContentWidth.
  useExtraAccountBalances?: UseExtraAccountBalances
  setModalContentWidth?: (width: string) => void
}

const Web3ConnectContext = createContext<Web3ConnectContextType | null>(null)

export const Web3ConnectProvider = Web3ConnectContext.Provider

export const useWeb3ConnectContext = () => {
  const context = useContext(Web3ConnectContext)
  if (!context) {
    throw new Error(
      "useWeb3ConnectContext must be used within a Web3ConnectProvider",
    )
  }
  return context
}
