import {
  getWallets,
  IdentifierString,
  Wallet as StandardWallet,
  WalletAccount as StandardWalletAccount,
} from "@mysten/wallet-standard"
import { PublicKey, VersionedTransaction } from "@solana/web3.js"
import bs58 from "bs58"

import { SolanaInjectedWindowProvider, SolanaSignature } from "@/types/solana"

const SOLANA_MAINNET_CHAIN: IdentifierString = "solana:mainnet"

type StandardEventsChangeProperties = {
  accounts?: readonly StandardWalletAccount[]
}

type SolanaTransactionInput = {
  account: StandardWalletAccount
  chain: IdentifierString
  transaction: Uint8Array
}

type SolanaWalletStandardFeatures = {
  "standard:connect": {
    connect: () => Promise<{ accounts: readonly StandardWalletAccount[] }>
  }
  "standard:disconnect"?: {
    disconnect: () => Promise<void>
  }
  "standard:events"?: {
    on: (
      event: "change",
      listener: (properties: StandardEventsChangeProperties) => void,
    ) => () => void
  }
  "solana:signTransaction": {
    signTransaction: (
      ...inputs: SolanaTransactionInput[]
    ) => Promise<{ signedTransaction: Uint8Array }[]>
  }
  "solana:signAndSendTransaction": {
    signAndSendTransaction: (
      ...inputs: SolanaTransactionInput[]
    ) => Promise<{ signature: Uint8Array }[]>
  }
}

const isSolanaChain = (chain: string) => chain.startsWith("solana:")

export const getSolanaStandardWallet = (
  name: string,
): StandardWallet | undefined => {
  return getWallets()
    .get()
    .find((wallet) => wallet.name === name && wallet.chains.some(isSolanaChain))
}

/**
 * Adapts a Wallet Standard solana wallet (registered via `registerWallet`,
 * e.g. Talisman) to the Phantom-style `SolanaInjectedWindowProvider`
 * interface consumed by `BaseSolanaWallet` and `SolanaSigner`.
 */
export class SolanaWalletStandardProvider
  implements SolanaInjectedWindowProvider
{
  isConnected = false

  private wallet: StandardWallet
  private account: StandardWalletAccount | undefined
  private listeners = new Map<(publicKey: PublicKey) => void, () => void>()

  constructor(wallet: StandardWallet) {
    this.wallet = wallet
  }

  private get features() {
    return this.wallet.features as SolanaWalletStandardFeatures
  }

  get publicKey(): PublicKey {
    return this.account
      ? new PublicKey(this.account.publicKey)
      : PublicKey.default
  }

  connect = async (): Promise<{ publicKey: PublicKey }> => {
    const { accounts } = await this.features["standard:connect"].connect()

    const account =
      accounts.find(({ chains }) => chains.some(isSolanaChain)) ?? accounts[0]

    if (!account) {
      throw new Error("No Solana account found.")
    }

    this.account = account
    this.isConnected = true

    return { publicKey: new PublicKey(account.publicKey) }
  }

  disconnect = async (): Promise<void> => {
    await this.features["standard:disconnect"]?.disconnect()
    this.account = undefined
    this.isConnected = false
  }

  on(event: "accountChanged", handler: (publicKey: PublicKey) => void): void
  on(event: "connect" | "disconnect", handler: () => void): void
  on(
    event: "accountChanged" | "connect" | "disconnect",
    handler: ((publicKey: PublicKey) => void) | (() => void),
  ): void {
    if (event !== "accountChanged") return

    const accountChangedHandler = handler as (publicKey: PublicKey) => void

    const unsubscribe = this.features["standard:events"]?.on(
      "change",
      ({ accounts }) => {
        const account = accounts?.[0]
        if (!account) return

        this.account = account
        accountChangedHandler(new PublicKey(account.publicKey))
      },
    )

    if (unsubscribe) {
      this.listeners.set(accountChangedHandler, unsubscribe)
    }
  }

  off(event: "accountChanged", handler: (publicKey: PublicKey) => void): void
  off(event: "connect" | "disconnect", handler: () => void): void
  off(
    event: "accountChanged" | "connect" | "disconnect",
    handler: ((publicKey: PublicKey) => void) | (() => void),
  ): void {
    if (event !== "accountChanged") return

    const accountChangedHandler = handler as (publicKey: PublicKey) => void
    this.listeners.get(accountChangedHandler)?.()
    this.listeners.delete(accountChangedHandler)
  }

  signTransaction = async (
    transaction: VersionedTransaction,
  ): Promise<SolanaSignature> => {
    const [signed] = await this.signAllTransactions([transaction])
    const signature = signed?.signatures[0]

    if (!signature) {
      throw new Error("Signing transaction failed.")
    }

    return { signature: bs58.encode(signature) }
  }

  signAllTransactions = async (
    transactions: VersionedTransaction[],
  ): Promise<VersionedTransaction[]> => {
    const account = await this.requireAccount()

    const outputs = await this.features[
      "solana:signTransaction"
    ].signTransaction(...this.toInputs(account, transactions))

    return outputs.map(({ signedTransaction }) =>
      VersionedTransaction.deserialize(signedTransaction),
    )
  }

  signAndSendTransaction = async (
    transaction: VersionedTransaction,
  ): Promise<SolanaSignature> => {
    const [signature] = await this.signAndSendAllTransactions([transaction])

    if (!signature) {
      throw new Error("Sending transaction failed.")
    }

    return signature
  }

  signAndSendAllTransactions = async (
    transactions: VersionedTransaction[],
  ): Promise<SolanaSignature[]> => {
    const account = await this.requireAccount()

    const outputs = await this.features[
      "solana:signAndSendTransaction"
    ].signAndSendTransaction(...this.toInputs(account, transactions))

    return outputs.map(({ signature }) => ({
      signature: bs58.encode(signature),
    }))
  }

  private requireAccount = async (): Promise<StandardWalletAccount> => {
    if (!this.account) {
      await this.connect()
    }

    if (!this.account) {
      throw new Error("No Solana account found.")
    }

    return this.account
  }

  private toInputs = (
    account: StandardWalletAccount,
    transactions: VersionedTransaction[],
  ): SolanaTransactionInput[] => {
    return transactions.map((transaction) => ({
      account,
      chain: SOLANA_MAINNET_CHAIN,
      transaction: transaction.serialize(),
    }))
  }
}
