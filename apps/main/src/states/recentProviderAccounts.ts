import { StoredAccount, useWeb3Connect } from "@galacticcouncil/web3-connect"
import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type WalletProviderType = StoredAccount["provider"]

type RecentProviderAccountsState = {
  recentByProvider: Partial<Record<WalletProviderType, string>>
}

type RecentProviderAccountsStore = RecentProviderAccountsState & {
  setRecentAccount: (account: StoredAccount) => void
}

export const useRecentProviderAccountsStore =
  create<RecentProviderAccountsStore>()(
    persist(
      (set) => ({
        recentByProvider: {},
        setRecentAccount: (account) =>
          set((state) => {
            if (
              state.recentByProvider[account.provider] === account.publicKey
            ) {
              return state
            }

            return {
              recentByProvider: {
                ...state.recentByProvider,
                [account.provider]: account.publicKey,
              },
            }
          }),
      }),
      {
        name: "recent-provider-accounts",
        version: 1,
      },
    ),
  )

type RecentProviderAccount = {
  provider: WalletProviderType
  publicKey: string
}

export const getRecentProviderAccount = <T extends RecentProviderAccount>(
  provider: WalletProviderType,
  accounts: T[],
  recentByProvider: Partial<Record<WalletProviderType, string>>,
): T | undefined => {
  const recentPublicKey = recentByProvider[provider]

  if (!recentPublicKey) {
    return accounts[0]
  }

  return (
    accounts.find(
      (account) =>
        account.provider === provider && account.publicKey === recentPublicKey,
    ) ?? accounts[0]
  )
}

export const useRecentProviderAccountSync = () => {
  const account = useWeb3Connect((state) => state.account)
  const setRecentAccount = useRecentProviderAccountsStore(
    (state) => state.setRecentAccount,
  )

  useEffect(() => {
    if (!account) return

    setRecentAccount(account)
  }, [account, setRecentAccount])
}
