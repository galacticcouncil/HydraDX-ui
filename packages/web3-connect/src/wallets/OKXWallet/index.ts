import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class OKXWallet extends BaseEIP1193Wallet {
  provider = WalletProviderType.OKXWallet
  accessor = "com.okex.wallet"
  title = "OKX Wallet"
  installUrl = "https://web3.okx.com/download"
  logo = logo
}

export class OKXWalletSol extends BaseSolanaWallet {
  provider = WalletProviderType.OKXWalletSol
  accessor = "OKX Wallet"
  title = "OKX Wallet"
  installUrl = "https://web3.okx.com/download"
  logo = logo
}

export class OKXWalletSui extends BaseSuiWallet {
  provider = WalletProviderType.OKXWalletSui
  accessor = "OKX Wallet"
  title = "OKX Wallet"
  installUrl = "https://web3.okx.com/download"
  logo = logo
}
