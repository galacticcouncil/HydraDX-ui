import { WalletProviderType } from "sections/web3-connect/wallets"

export const MOBILE_PROVIDERS: WalletProviderType[] = [
  WalletProviderType.MetaMask,
  WalletProviderType.Talisman,
  WalletProviderType.TalismanEvm,
  WalletProviderType.SubwalletJS,
  WalletProviderType.SubwalletEvm,
  WalletProviderType.Phantom,
  WalletProviderType.Enkrypt,
  WalletProviderType.NovaWallet,
  WalletProviderType.NovaWalletEvm,
  WalletProviderType.WalletConnect,
]

export const DESKTOP_PROVIDERS: WalletProviderType[] = [
  WalletProviderType.MetaMask,
  WalletProviderType.Talisman,
  WalletProviderType.TalismanEvm,
  WalletProviderType.SubwalletJS,
  WalletProviderType.SubwalletEvm,
  WalletProviderType.Phantom,
  WalletProviderType.Enkrypt,
  WalletProviderType.PolkadotJS,
  WalletProviderType.WalletConnect,
]

export const EVM_PROVIDERS: WalletProviderType[] = [
  WalletProviderType.MetaMask,
  WalletProviderType.TalismanEvm,
  WalletProviderType.SubwalletEvm,
  WalletProviderType.NovaWalletEvm,
  WalletProviderType.Phantom,
  WalletProviderType.WalletConnect,
]

export const SUBSTRATE_PROVIDERS: WalletProviderType[] = [
  WalletProviderType.Talisman,
  WalletProviderType.SubwalletJS,
  WalletProviderType.Enkrypt,
  WalletProviderType.PolkadotJS,
  WalletProviderType.NovaWallet,
  WalletProviderType.WalletConnect,
]

export const ALTERNATIVE_PROVIDERS: WalletProviderType[] = [
  WalletProviderType.ExternalWallet,
]
