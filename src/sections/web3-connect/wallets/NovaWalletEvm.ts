import NovaWalletLogo from "assets/icons/NovaWallet.svg"

import { MetaMask } from "./MetaMask"
import { isNovaWalletEvm } from "utils/metamask"

export class NovaWalletEvm extends MetaMask {
  extensionName = "nova-wallet-evm"
  title = "Nova Wallet EVM"
  installUrl = "https://novawallet.io"
  logo = {
    src: NovaWalletLogo,
    alt: "Nova Wallet Logo",
  }

  get installed() {
    return isNovaWalletEvm(window.ethereum)
  }

  get rawExtension() {
    return window.ethereum
  }
}
