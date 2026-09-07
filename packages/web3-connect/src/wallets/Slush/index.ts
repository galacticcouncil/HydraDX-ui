import { WalletProviderType } from "@/config/providers"
import { BaseSuiWallet } from "@/wallets/BaseSuiWallet"

import logo from "./logo.svg"

export class Slush extends BaseSuiWallet {
  provider = WalletProviderType.Slush
  accessor = "Slush"
  title = "Slush"
  installUrl = "https://slush.app"
  logo = logo
}
