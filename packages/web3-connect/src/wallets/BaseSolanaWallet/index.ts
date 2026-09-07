import { shortenAccountAddress } from "@galacticcouncil/utils"
import { PublicKey } from "@solana/web3.js"

import { WalletProviderType } from "@/config/providers"
import { SolanaSigner } from "@/signers/SolanaSigner"
import { SolanaInjectedWindowProvider } from "@/types/solana"
import { Wallet, WalletAccount } from "@/types/wallet"
import { AuthError, BaseWalletError, NotInstalledError } from "@/utils/errors"
import {
  getSolanaStandardWallet,
  SolanaWalletStandardProvider,
} from "@/utils/solanaWalletStandard"

export class BaseSolanaWallet implements Wallet {
  provider = "" as WalletProviderType
  accessor = ""
  title = ""
  installUrl = ""
  logo = ""

  _rawExtension: SolanaInjectedWindowProvider | undefined
  _extension: SolanaInjectedWindowProvider | undefined
  _signer: SolanaSigner | undefined
  _enabled: boolean = false

  _accounts: WalletAccount[] = []

  get extension() {
    return this._extension
  }

  get signer() {
    return this._signer
  }

  get installed() {
    return !!this.rawExtension
  }

  get enabled() {
    return this._enabled
  }

  /**
   * Most Solana wallets register through the Wallet Standard rather than
   * injecting a window object, so the lookup is lazy — the extension may
   * not have registered yet when the wallet is constructed. Wallets that
   * do inject (Phantom, Solflare, Brave) override this.
   */
  get rawExtension() {
    if (!this._rawExtension && this.accessor) {
      const wallet = getSolanaStandardWallet(this.accessor)

      if (wallet) {
        this._rawExtension = new SolanaWalletStandardProvider(wallet)
      }
    }

    return this._rawExtension
  }

  transformError = (): Error => {
    return new Error("Could not connect to Solana with current account.")
  }

  getAccounts = async (): Promise<WalletAccount[]> => {
    return this._accounts
  }

  setAccounts = (accounts: WalletAccount[]) => {
    this._accounts = accounts
  }

  enable = async () => {
    if (!this.installed || !this.rawExtension) {
      throw new NotInstalledError(this)
    }

    const wallet = this.rawExtension

    try {
      const connection = await wallet.connect().catch(() => {
        throw new AuthError(this)
      })
      const publicKey = connection?.publicKey || wallet.publicKey

      if (!publicKey) return

      const address = publicKey.toBase58()

      this._enabled = true
      this._signer = address ? new SolanaSigner(address, wallet) : undefined
      this._extension = wallet

      this.setAccounts([
        {
          address,
          name: shortenAccountAddress(address),
          provider: this.provider,
        },
      ])

      //this.subscribeAccounts()
    } catch (err: unknown) {
      if (err instanceof BaseWalletError) {
        throw err
      }
      throw this.transformError()
    }
  }

  subscribeAccounts = () => {
    const extension = this._extension
    if (!extension) {
      throw new Error(
        `The 'Wallet.enable(dappname)' function should be called first.`,
      )
    }

    const handler = (publicKey: PublicKey) => {
      if (!extension) return
      const address = publicKey.toBase58()

      this._signer = address ? new SolanaSigner(address, extension) : undefined

      this.setAccounts([
        {
          address,
          name: shortenAccountAddress(address),
          provider: this.provider,
        },
      ])
    }

    extension.on("accountChanged", handler)
    return () => {
      extension.off("accountChanged", handler)
    }
  }

  disconnect = () => {
    this._enabled = false
    this._extension = undefined
    this._signer = undefined
    this._accounts = []
  }
}
