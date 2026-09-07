import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class Nightly extends BaseEIP1193Wallet {
  provider = WalletProviderType.Nightly
  accessor = "app.nightly"
  title = "Nightly"
  installUrl = "https://nightly.app/download"
  logo = logo
}

export class NightlySol extends BaseSolanaWallet {
  provider = WalletProviderType.NightlySol
  accessor = "Nightly"
  title = "Nightly"
  installUrl = "https://nightly.app/download"
  logo = logo
}

export class NightlySui extends BaseSuiWallet {
  provider = WalletProviderType.NightlySui
  accessor = "Nightly"
  title = "Nightly"
  installUrl = "https://nightly.app/download"
  logo = logo
}
