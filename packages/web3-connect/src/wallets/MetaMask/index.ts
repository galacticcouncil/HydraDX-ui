import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"

import logo from "./logo.svg"

export class MetaMask extends BaseEIP1193Wallet {
  provider = WalletProviderType.MetaMask
  accessor = "io.metamask"
  title = "MetaMask"
  installUrl = "https://metamask.io/download"
  logo = logo
}

export class MetaMaskSol extends BaseSolanaWallet {
  provider = WalletProviderType.MetaMaskSol
  accessor = "MetaMask"
  title = "MetaMask"
  installUrl = "https://metamask.io/download"
  logo = logo
}
