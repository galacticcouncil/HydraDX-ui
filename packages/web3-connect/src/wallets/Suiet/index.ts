import { WalletProviderType } from "@/config/providers"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class Suiet extends BaseSuiWallet {
  provider = WalletProviderType.Suiet
  accessor = "Suiet"
  title = "Suiet"
  installUrl = "https://suiet.app"
  logo = logo
}
