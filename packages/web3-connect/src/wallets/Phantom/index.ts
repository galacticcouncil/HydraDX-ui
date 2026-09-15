import { WalletProviderType } from "@/config/providers"
import { isPhantom } from "@/utils/solana"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class Phantom extends BaseSolanaWallet {
  provider = WalletProviderType.Phantom
  title = "Phantom"
  installUrl = "https://phantom.com/download"
  logo = logo

  get installed() {
    return isPhantom(window?.phantom?.solana)
  }

  get rawExtension() {
    return window?.phantom?.solana
  }

  transformError = () => {
    return new Error("Could not connect to Solana with current account.")
  }
}

export class PhantomSui extends BaseSuiWallet {
  provider = WalletProviderType.PhantomSui
  accessor = "Phantom"
  title = "Phantom"
  installUrl = "https://phantom.com/download"
  logo = logo

  transformError = () => {
    return new Error("Could not connect to Sui with current account.")
  }
}

export class PhantomEvm extends BaseEIP1193Wallet {
  provider = WalletProviderType.PhantomEvm
  accessor = "app.phantom"
  title = "Phantom"
  installUrl = "https://phantom.com/download"
  logo = logo
}
