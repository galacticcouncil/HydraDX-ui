import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class Backpack extends BaseEIP1193Wallet {
  provider = WalletProviderType.Backpack
  accessor = "app.backpack"
  title = "Backpack"
  installUrl = "https://backpack.app/download"
  logo = logo
}

export class BackpackSol extends BaseSolanaWallet {
  provider = WalletProviderType.BackpackSol
  accessor = "Backpack"
  title = "Backpack"
  installUrl = "https://backpack.app/download"
  logo = logo
}

export class BackpackSui extends BaseSuiWallet {
  provider = WalletProviderType.BackpackSui
  accessor = "Backpack"
  title = "Backpack"
  installUrl = "https://backpack.app/download"
  logo = logo
}
