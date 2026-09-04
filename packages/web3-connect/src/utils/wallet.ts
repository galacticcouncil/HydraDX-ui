import {
  EvmAddr,
  isEvmParachainAccount,
  isH160Address,
  NearAddr,
  safeConvertAddressSS58,
  safeConvertH160toSS58,
  safeConvertSolanaAddressToSS58,
  safeConvertSS58toH160,
  safeConvertSS58toPublicKey,
  safeConvertSuiAddressToSS58,
  SolanaAddr,
  Ss58Addr,
  stringEquals,
  SuiAddr,
  ZecAddr,
} from "@galacticcouncil/utils"

import {
  SOLANA_PROVIDERS,
  SUI_PROVIDERS,
  WalletProviderType,
} from "@/config/providers"
import { WalletMode } from "@/config/wallet"

/**
 * The mode lookups live in the registry now. Re-exported here because every
 * call site still imports them from `@/utils`.
 */
export {
  getWalletModeIcon,
  getWalletModeName,
  getWalletModesByProviderType,
} from "@/config/wallet"
import {
  Account,
  COMPATIBLE_WALLET_PROVIDERS,
  StoredAccount,
  useWeb3Connect,
} from "@/hooks/useWeb3Connect"
import { Wallet, WalletAccount } from "@/types/wallet"

const toStoredSolanaAccount = ({
  address,
  name,
  provider,
}: WalletAccount): StoredAccount => {
  const ss58Format = safeConvertSolanaAddressToSS58(address)
  return {
    publicKey: safeConvertSS58toPublicKey(ss58Format),
    address: ss58Format,
    rawAddress: address,
    name: name ?? "",
    provider: provider,
  }
}

const toStoredSuiAccount = ({
  address,
  name,
  provider,
}: WalletAccount): StoredAccount => {
  const ss58Format = safeConvertSuiAddressToSS58(address)
  return {
    publicKey: safeConvertSS58toPublicKey(ss58Format),
    address: ss58Format,
    rawAddress: address,
    name: name ?? "",
    provider: provider,
  }
}

const toStoredDefaultAccount = ({
  address,
  name,
  provider,
}: WalletAccount): StoredAccount => {
  const isEvm = isH160Address(address)

  const ss58Format = isEvm
    ? safeConvertH160toSS58(address)
    : safeConvertAddressSS58(address)

  const publicKey = safeConvertSS58toPublicKey(ss58Format)

  return {
    publicKey,
    address: ss58Format,
    rawAddress: isEvm ? address : ss58Format,
    name: name ?? "",
    provider: provider,
  }
}

export const toStoredAccount = ({
  address,
  name,
  provider,
}: WalletAccount): StoredAccount => {
  switch (true) {
    case SOLANA_PROVIDERS.includes(provider):
      return toStoredSolanaAccount({ address, name, provider })
    case SUI_PROVIDERS.includes(provider):
      return toStoredSuiAccount({ address, name, provider })
    default:
      return toStoredDefaultAccount({ address, name, provider })
  }
}

export const toAccount = (account: StoredAccount): Account => {
  return {
    ...account,
    displayAddress: isEvmParachainAccount(account.address)
      ? safeConvertSS58toH160(account.address)
      : account.rawAddress,
    /**
     * Whether Hydration can represent this account's address at all. Solana
     * and Sui addresses cannot be, so those accounts connect and display
     * everywhere but cannot drive a Hydration action.
     *
     * Watched addresses pass: the user pasted an address Hydration accepts.
     * They still cannot sign - `ReviewTransactionSubmitButton` blocks that
     * separately, on the provider rather than on this flag.
     */
    canUseOnHydration:
      COMPATIBLE_WALLET_PROVIDERS.includes(account.provider) ||
      account.provider === WalletProviderType.ExternalWallet,
  }
}

export const getWalletModeByAddress = (address: string) => {
  switch (true) {
    case EvmAddr.isValid(address):
      return WalletMode.EVM
    case Ss58Addr.isValid(address):
      return WalletMode.Substrate
    case SolanaAddr.isValid(address):
      return WalletMode.Solana
    case SuiAddr.isValid(address):
      return WalletMode.Sui
    case NearAddr.isValid(address):
      return WalletMode.Near
    case ZecAddr.isValid(address):
      return WalletMode.Zcash
    default:
      return null
  }
}

export type AccountsSubscribeOptions = {
  onDisconnect: () => void
  onAccountsChange: (accounts: WalletAccount[]) => void | Promise<void>
  onMainAccountChange: (mainAccount: WalletAccount) => void | Promise<void>
}

export function subscribeWalletAccounts(
  wallet: Wallet,
  {
    onDisconnect,
    onAccountsChange,
    onMainAccountChange,
  }: AccountsSubscribeOptions,
) {
  const unsubscribe = wallet.subscribeAccounts((accounts) => {
    if (!accounts || accounts.length === 0) {
      return onDisconnect()
    }

    onAccountsChange(accounts)

    const { account: currentAccount } = useWeb3Connect.getState()
    if (!currentAccount || currentAccount.provider !== wallet.provider) return

    const publicKey = currentAccount.isMultisig
      ? safeConvertSS58toPublicKey(currentAccount.multisigSignerAddress ?? "")
      : currentAccount.publicKey

    const isCurrentAccountConnected = accounts.some((a) =>
      stringEquals(toStoredAccount(a).publicKey, publicKey),
    )

    if (isCurrentAccountConnected) return

    const [mainAccount] = accounts
    return onMainAccountChange(mainAccount)
  })

  return unsubscribe
}

export function getUniqueAccountKey(account: {
  provider: string
  publicKey: string
}) {
  return `${account.provider}-${account.publicKey}`
}
