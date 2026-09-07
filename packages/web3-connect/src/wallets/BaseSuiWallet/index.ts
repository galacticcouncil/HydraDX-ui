import { shortenAccountAddress } from "@galacticcouncil/utils"
import {
  getWallets,
  isWalletWithRequiredFeatureSet,
  WalletWithRequiredFeatures,
} from "@mysten/wallet-standard"
import { Wallet as StandardWallet } from "@mysten/wallet-standard"

import { WalletProviderType } from "@/config/providers"
import { SuiSigner } from "@/signers/SuiSigner"
import { SubscriptionFn, Wallet, WalletAccount } from "@/types/wallet"
import { AuthError, NotInstalledError } from "@/utils/errors"

const getSuiStandardWallet = (name: string): StandardWallet | undefined =>
  getWallets()
    .get()
    .find(
      (wallet) => wallet.name === name && wallet.chains.includes("sui:mainnet"),
    )

export class BaseSuiWallet implements Wallet {
  provider = "" as WalletProviderType
  accessor = ""
  title = ""
  installUrl = ""
  logo = ""

  _provider: StandardWallet | undefined
  _rawExtension: StandardWallet | undefined
  _extension: WalletWithRequiredFeatures | undefined
  _signer: SuiSigner | undefined
  _enabled: boolean = false

  _accounts: WalletAccount[] = []

  get installed() {
    const provider = this.rawExtension
    return !!provider && isWalletWithRequiredFeatureSet(provider)
  }

  get enabled() {
    return this._enabled
  }

  /**
   * Resolved lazily rather than in a constructor: the extension may not
   * have registered yet when the wallet is constructed. `sui:mainnet` is
   * required — a wallet announcing only devnet/testnet is not usable here.
   */
  get rawExtension() {
    if (!this._provider && this.accessor) {
      this._provider = getSuiStandardWallet(this.accessor)
    }

    return this._provider
  }

  get extension() {
    return this._extension
  }

  get signer() {
    return this._signer
  }

  transformError = (err: Error): Error => {
    return new Error(err.message)
  }

  enable = async () => {
    if (
      !this.installed ||
      !this.rawExtension ||
      !isWalletWithRequiredFeatureSet(this.rawExtension)
    ) {
      throw new NotInstalledError(this)
    }

    const wallet = this.rawExtension

    try {
      await wallet.features["standard:connect"].connect().catch(() => {
        throw new AuthError(this)
      })

      const { accounts } = wallet

      if (!accounts.length) {
        throw new AuthError(this)
      }

      const account = accounts[0]
      const address = account.address

      this._signer = new SuiSigner(account, wallet)
      this._extension = wallet
      this._enabled = true

      this.setAccounts([
        {
          address,
          name: account?.label || shortenAccountAddress(address),
          provider: this.provider,
        },
      ])
    } catch (err: unknown) {
      throw this.transformError(err as Error)
    }
  }

  setAccounts = (accounts: WalletAccount[]) => {
    this._accounts = accounts
  }

  getAccounts = async (): Promise<WalletAccount[]> => {
    return this._accounts
  }

  subscribeAccounts = (callback: SubscriptionFn) => {
    const extension = this._extension
    if (!extension) {
      throw new NotInstalledError(this)
    }

    const eventsFeature = extension.features["standard:events"]
    if (!eventsFeature) return () => {}

    const unsubscribe = eventsFeature.on("change", (properties) => {
      if (!properties.accounts) return

      const accounts = properties.accounts
      if (!accounts || accounts.length === 0) {
        callback(undefined)
        return
      }

      const walletAccounts = accounts.map((account) => ({
        address: account.address,
        name: account.label || shortenAccountAddress(account.address),
        provider: this.provider,
      }))

      this.setAccounts(walletAccounts)
      const firstAccount = accounts[0]
      this._signer = new SuiSigner(firstAccount, extension)
      callback(walletAccounts)
    })

    return unsubscribe
  }

  disconnect = () => {
    this._enabled = false
    this._extension = undefined
    this._signer = undefined
    this._accounts = []
  }
}
