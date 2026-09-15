import { shortenAccountAddress } from "@galacticcouncil/utils"
import { isString } from "remeda"
import { EIP1193Provider } from "viem"

import { WalletProviderType } from "@/config/providers"
import { EthereumSigner } from "@/signers/EthereumSigner"
import { EIP6963AnnounceProviderEvent } from "@/types/evm"
import { SubscriptionFn, Wallet, WalletAccount } from "@/types/wallet"
import { AuthError, BaseWalletError, NotInstalledError } from "@/utils/errors"

export class BaseEIP1193Wallet implements Wallet {
  provider = "" as WalletProviderType
  accessor = ""
  title = ""
  installUrl = ""
  logo = ""

  _rawExtension: EIP1193Provider | undefined
  _extension: Required<EIP1193Provider> | undefined
  _signer: EthereumSigner | undefined
  _enabled: boolean = false

  constructor() {
    window.addEventListener("eip6963:announceProvider", (e: unknown) =>
      this.handleAnnounceProvider(e as EIP6963AnnounceProviderEvent),
    )
  }

  get extension() {
    return this._extension
  }

  get signer() {
    return this._signer
  }

  get installed() {
    return !!this._rawExtension
  }

  get enabled() {
    return this._enabled
  }

  get rawExtension() {
    return this._rawExtension
  }

  handleAnnounceProvider = (e: EIP6963AnnounceProviderEvent) => {
    if (
      e.detail.info.rdns === this.accessor ||
      e.detail.info.rdns === `${this.accessor}.mobile`
    ) {
      this._rawExtension = e.detail.provider
    }
  }

  transformError = (err: Error): Error => {
    return new Error(err.message)
  }

  enable = async () => {
    if (!this.installed || !this.rawExtension) {
      throw new NotInstalledError(this)
    }

    try {
      const extension = this.rawExtension

      const addresses = await extension
        .request({
          method: "eth_requestAccounts",
        })
        .catch(() => {
          throw new AuthError(this)
        })

      const address =
        Array.isArray(addresses) && addresses.length > 0 ? addresses[0] : ""

      this._enabled = true
      this._extension = extension
      this._signer = address
        ? new EthereumSigner(address, extension)
        : undefined
    } catch (err: unknown) {
      //@ts-expect-error unknown error type
      if (err.code === -32002) {
        throw new NotInstalledError(this)
      }
      if (err instanceof BaseWalletError) {
        throw err
      }
      throw this.transformError(err as Error)
    }
  }

  getAccounts = async (): Promise<WalletAccount[]> => {
    if (!this._extension) {
      throw new NotInstalledError(this)
    }

    const accounts = (await this._extension.request({
      method: "eth_requestAccounts",
    })) as string[]

    return (accounts || [])
      .filter((address): address is string => !!address)
      .slice(0, 1)
      .map(this.toWalletAccount)
  }

  toWalletAccount = (address: string): WalletAccount => {
    return {
      address: address,
      provider: this.provider,
      name: shortenAccountAddress(address),
    }
  }

  subscribeAccounts = (callback: SubscriptionFn) => {
    const extension = this._extension
    if (!extension) {
      throw new NotInstalledError(this)
    }

    const handler = (payload: unknown) => {
      const addresses = Array.isArray(payload)
        ? payload.slice(0, 1).filter(isString)
        : []

      const address = addresses[0]

      this._signer = address
        ? new EthereumSigner(address, extension)
        : undefined

      callback?.(addresses.map(this.toWalletAccount))
    }

    extension.on("accountsChanged", handler)

    return () => {
      extension.removeListener("accountsChanged", handler)
    }
  }

  disconnect = () => {
    this._enabled = false
    this._extension = undefined
    this._signer = undefined
  }
}
