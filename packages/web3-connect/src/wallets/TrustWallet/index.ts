import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"

import logo from "./logo.svg"

export class TrustWallet extends BaseEIP1193Wallet {
  provider = WalletProviderType.TrustWallet
  accessor = "com.trustwallet.app"
  title = "Trust Wallet"
  installUrl = "https://trustwallet.com/download"
  logo = logo
}

export class TrustWalletSol extends BaseSolanaWallet {
  provider = WalletProviderType.TrustWalletSol
  accessor = "Trust Wallet"
  title = "Trust Wallet"
  installUrl = "https://trustwallet.com/download"
  logo = logo
}
