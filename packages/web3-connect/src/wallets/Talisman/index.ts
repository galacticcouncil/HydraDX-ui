import { isH160Address, isSS58Address } from "@galacticcouncil/utils"
import { InjectedPolkadotAccount } from "polkadot-api/pjs-signer"

import { WalletProviderType } from "@/config/providers"
import {
  getSolanaStandardWallet,
  SolanaWalletStandardProvider,
} from "@/utils/solanaWalletStandard"
import { BaseEIP1193Wallet } from "@/wallets/BaseEIP1193Wallet"
import { BaseSolanaWallet } from "@/wallets/BaseSolanaWallet"
import { BaseSubstrateWallet } from "@/wallets/BaseSubstrateWallet"

import logo from "./logo.svg"

export class Talisman extends BaseSubstrateWallet {
  provider = WalletProviderType.Talisman
  title = "Talisman"
  accessor = "talisman"
  installUrl = "https://talisman.xyz/download"
  logo = logo
  accountFilter = (account: InjectedPolkadotAccount) => {
    return isSS58Address(account.address)
  }
}

export class TalismanH160 extends BaseSubstrateWallet {
  provider = WalletProviderType.TalismanH160
  title = "Talisman"
  accessor = "talisman"
  installUrl = "https://talisman.xyz/download"
  logo = logo
  accountFilter = (account: InjectedPolkadotAccount) => {
    return isH160Address(account.address)
  }
}

export class TalismanEvm extends BaseEIP1193Wallet {
  provider = WalletProviderType.TalismanEvm
  title = "Talisman"
  accessor = "xyz.talisman"
  installUrl = "https://talisman.xyz/download"
  logo = logo
}

export class TalismanSol extends BaseSolanaWallet {
  provider = WalletProviderType.TalismanSol
  title = "Talisman"
  accessor = "Talisman"
  installUrl = "https://talisman.xyz/download"
  logo = logo

  get installed() {
    return !!this.rawExtension
  }

  // Talisman registers its solana provider through the Wallet Standard
  // instead of injecting a window object, so it is resolved lazily to
  // give the extension time to register.
  get rawExtension() {
    if (!this._rawExtension) {
      const wallet = getSolanaStandardWallet(this.accessor)

      if (wallet) {
        this._rawExtension = new SolanaWalletStandardProvider(wallet)
      }
    }

    return this._rawExtension
  }

  transformError = () => {
    return new Error("Could not connect to Solana with current account.")
  }
}
