import { WalletProviderType } from "@/config/providers"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"

import logo from "./logo.svg"

// EVM only — Coinbase announces via EIP-6963 but registers no Wallet
// Standard wallet, so it has no Solana or Sui flavor to add.
export class CoinbaseWallet extends BaseEIP1193Wallet {
  provider = WalletProviderType.CoinbaseWallet
  accessor = "com.coinbase.wallet"
  title = "Coinbase Wallet"
  installUrl = "https://www.coinbase.com/wallet/downloads"
  logo = logo
}
