import { SubscriptionFn, Wallet, getWallets } from "@talismn/connect-wallets"

import { ExternalWallet } from "./ExternalWallet"
import { MetaMask } from "./MetaMask"
import { Talisman } from "./Talisman"
import { TalismanEvm } from "./TalismanEvm"
import { NovaWallet } from "./NovaWallet"
import { NovaWalletEvm } from "./NovaWalletEvm"
import { WalletConnect } from "./WalletConnect"
import { H160, isEvmAddress } from "utils/evm"
import { SubWalletEvm } from "./SubWalletEvm"
import { SubWallet } from "./SubWallet"
import { TrustWallet } from "./TrustWallet"
import { BraveWallet } from "./BraveWallet"
import { EIP6963AnnounceProviderEvent } from "sections/web3-connect/types"
import {
  SUBSTRATE_H160_PROVIDERS,
  WalletProviderType,
} from "sections/web3-connect/constants/providers"
import { useWeb3ConnectStore } from "sections/web3-connect/store/useWeb3ConnectStore"

export type WalletProvider = {
  type: WalletProviderType
  wallet: Wallet
}

const wallets = getWallets().filter(
  ({ extensionName }) =>
    !SUBSTRATE_H160_PROVIDERS.includes(extensionName as WalletProviderType),
)

const onMetaMaskLikeAccountChange =
  (type: WalletProviderType): SubscriptionFn =>
  (accounts) => {
    const state = useWeb3ConnectStore.getState()
    if (!accounts || accounts.length === 0) {
      state.disconnect()
    } else {
      const [{ address, name }] = accounts
      const isEvm = isEvmAddress(address)
      state.setAccount({
        address: isEvm ? new H160(address).toAccount() : address,
        displayAddress: address,
        provider: type,
        name: name ?? "",
        isExternalWalletConnected: false,
      })
    }
  }

const novaWallet: Wallet = new NovaWallet()
const novaWalletEvm: Wallet = new NovaWalletEvm({
  onAccountsChanged: onMetaMaskLikeAccountChange(WalletProviderType.NovaWallet),
})

const talisman = new Talisman()
const talismanEvm: Wallet = new TalismanEvm({
  onAccountsChanged: onMetaMaskLikeAccountChange(
    WalletProviderType.TalismanEvm,
  ),
})
const subwallet: Wallet = new SubWallet()
const subwalletEvm: Wallet = new SubWalletEvm({
  onAccountsChanged: onMetaMaskLikeAccountChange(
    WalletProviderType.SubwalletEvm,
  ),
})

const metaMask: Wallet = new MetaMask({
  onAccountsChanged: onMetaMaskLikeAccountChange(WalletProviderType.MetaMask),
})

const trustWallet: Wallet = new TrustWallet({
  onAccountsChanged: onMetaMaskLikeAccountChange(
    WalletProviderType.TrustWallet,
  ),
})

const walletConnect: Wallet = new WalletConnect({
  onModalClose: (session) => {
    if (!session) {
      const state = useWeb3ConnectStore.getState()
      state.disconnect()
      if (state.open) {
        state.toggle()
      }
    }
  },
  onSesssionDelete: () => {
    const state = useWeb3ConnectStore.getState()
    state.disconnect()
  },
})

const externalWallet: Wallet = new ExternalWallet()

export let SUPPORTED_WALLET_PROVIDERS: WalletProvider[] = [
  ...wallets,
  metaMask,
  talisman,
  talismanEvm,
  subwalletEvm,
  subwallet,
  trustWallet,
  novaWallet,
  novaWalletEvm,
  walletConnect,
  externalWallet,
].map((wallet) => ({
  wallet,
  type: normalizeProviderType(wallet),
}))

function normalizeProviderType(wallet: Wallet): WalletProviderType {
  if (wallet instanceof NovaWallet) {
    return WalletProviderType.NovaWallet
  }

  return wallet.extensionName as WalletProviderType
}

export function getSupportedWallets() {
  return SUPPORTED_WALLET_PROVIDERS
}

function syncSupportedWalletProviders(wallet: Wallet) {
  const type = normalizeProviderType(wallet)
  SUPPORTED_WALLET_PROVIDERS = [
    ...SUPPORTED_WALLET_PROVIDERS.filter((provider) => provider.type !== type),
    {
      wallet,
      type,
    },
  ]
}

const eip6963ProvidersByRdns = new Map([
  ["io.metamask", { Wallet: MetaMask, type: WalletProviderType.MetaMask }],
  [
    "com.trustwallet.app",
    { Wallet: TrustWallet, type: WalletProviderType.TrustWallet },
  ],
  [
    "xyz.talisman",
    { Wallet: TalismanEvm, type: WalletProviderType.TalismanEvm },
  ],
  [
    "com.brave.wallet",
    { Wallet: BraveWallet, type: WalletProviderType.BraveWallet },
  ],
])

/**
 * Handles the event of EIP-6963 standard to announce injected Wallet Providers
 * For more information, refer to https://eips.ethereum.org/EIPS/eip-6963
 */
export function handleAnnounceProvider(event: EIP6963AnnounceProviderEvent) {
  const provider = eip6963ProvidersByRdns.get(event.detail.info.rdns)

  if (provider) {
    syncSupportedWalletProviders(
      new provider.Wallet({
        provider: event.detail.provider,
        onAccountsChanged: onMetaMaskLikeAccountChange(provider.type),
      }),
    )
  }
}
