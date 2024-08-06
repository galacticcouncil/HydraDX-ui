import NovaWalletLogo from "assets/icons/NovaWallet.svg"

import { MetaMask } from "./MetaMask"
import { isNovaWalletEvm } from "utils/metamask"
import { WalletProviderType } from "sections/web3-connect/Web3Connect.utils"

export class NovaWalletEvm extends MetaMask {
  extensionName = WalletProviderType.NovaWalletEvm
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
