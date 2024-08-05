import { isTrustWallet } from "utils/metamask"
import { MetaMask } from "./MetaMask"
import { WalletProviderType } from "sections/web3-connect/constants/providers"

import TrustWalletLogo from "assets/icons/TrustWalletLogo.svg"

export class TrustWallet extends MetaMask {
  extensionName = WalletProviderType.TrustWallet
  title = "Trust Wallet"
  installUrl = "https://trustwallet.com"
  logo = {
    src: TrustWalletLogo,
    alt: "Trust Wallet Logo",
  }

  get installed() {
    const provider = this._provider || window.ethereum
    return isTrustWallet(provider)
  }

  get rawExtension() {
    return this._provider || window.ethereum
  }
}
