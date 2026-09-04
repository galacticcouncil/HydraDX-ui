import {
  arraySearch,
  isEvmParachainAccount,
  isSS58Address,
} from "@galacticcouncil/utils"
import { pipe, sortBy } from "remeda"

import { WalletProviderType } from "@/config/providers"
import { PROVIDERS_BY_WALLET_MODE, WalletMode } from "@/config/wallet"
import type { Account } from "@/hooks/useWeb3Connect"

/**
 * Search and mode filters for the account list.
 *
 * Imports the registry directly rather than through `@/hooks/useWeb3Connect`,
 * and takes `Account` as a type-only import, so nothing here reaches
 * `@/wallets` and touches `window`. Same reason `@/utils/walletSource` stays
 * out of the `@/utils` barrel - do not re-export this from there either.
 */
export const isAccountSelected = (
  currentAccount: Account | null,
  account?: Account | null,
) => {
  if (!currentAccount || !account) return false
  return (
    currentAccount.address === account.address &&
    currentAccount.provider === account.provider
  )
}

export const searchAccounts = (phrase: string) => (accounts: Account[]) => {
  if (!phrase) return accounts
  return arraySearch(accounts, phrase, [
    "name",
    "displayAddress",
    "address",
    "provider",
  ])
}

export const filterAccounts = (mode: WalletMode) => (accounts: Account[]) => {
  if (mode === WalletMode.Default) {
    return accounts
  }

  return accounts.filter((account) => {
    if (account.provider === WalletProviderType.ExternalWallet) {
      const isEvmAddress = isEvmParachainAccount(account.address)
      switch (mode) {
        case WalletMode.EVM:
          return isEvmAddress
        case WalletMode.Substrate:
          return !isEvmAddress && isSS58Address(account.address)
        default:
          /**
           * A watched address has no provider to match on. Modes without an
           * address test show it rather than dropping it - the same stance
           * `isAccountValidOnChain` takes for external accounts.
           */
          return true
      }
    }

    return PROVIDERS_BY_WALLET_MODE[mode].includes(account.provider)
  })
}

export const getFilteredAccounts = (
  accounts: Account[],
  currentAccount: Account | null,
  search: string,
  mode: WalletMode,
) => {
  return pipe(
    accounts,
    sortBy((account) => !isAccountSelected(currentAccount, account)),
    searchAccounts(search),
    filterAccounts(mode),
  )
}
