import { updateQueryString } from "@galacticcouncil/utils"
import { produce } from "immer"
import { omit, uniqueBy } from "remeda"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { Web3ConnectModalPage } from "@/config/modal"
import { WalletProviderType } from "@/config/providers"
import {
  COMPATIBLE_WALLET_PROVIDERS,
  PROVIDERS_BY_WALLET_MODE,
  WalletMode,
} from "@/config/wallet"
import { getUniqueAccountKey } from "@/utils/wallet"
import { ExternalWallet, getWallet } from "@/wallets"
import { BaseSubstrateWallet } from "@/wallets/BaseSubstrateWallet"

export enum WalletProviderStatus {
  Connected = "connected",
  Pending = "pending",
  Disconnected = "disconnected",
  Error = "error",
}

export { WalletMode } from "@/config/wallet"

export { COMPATIBLE_WALLET_PROVIDERS, PROVIDERS_BY_WALLET_MODE }

export type StoredAccount = {
  name: string
  publicKey: string
  address: string
  rawAddress: string
  provider: WalletProviderType
  delegate?: string
  balance?: number
  isMultisig?: boolean
  multisigConfigId?: string
  multisigSignerAddress?: string
}

export type Account = StoredAccount & {
  displayAddress: string
  canUseOnHydration: boolean
}

type Web3ConnectModalMeta = {
  title?: string
  description?: string
  hideExternalWallet?: boolean
  initialPage?: Web3ConnectModalPage
  initialProvider?: WalletProviderType
}

export type WalletProviderEntry = {
  type: WalletProviderType
  status: WalletProviderStatus
}

// Providers, not brands. Talisman alone is four entries.
const RECENT_PROVIDERS_LIMIT = 8

export type WalletProviderState = {
  open: boolean
  providers: WalletProviderEntry[]
  recentProvider: WalletProviderType | null
  recentlyUsedProviders: WalletProviderType[]
  account: StoredAccount | null
  accounts: StoredAccount[]
  mode: WalletMode
  error?: string
  meta?: Web3ConnectModalMeta | null
}

export type WalletProviderStore = WalletProviderState & {
  toggle: (mode?: WalletMode, meta?: Web3ConnectModalMeta) => void
  setAccount: (account: StoredAccount | null) => void
  setAccounts: (accounts: StoredAccount[], type: WalletProviderType) => void
  setBalances: (balances: ReadonlyMap<string, number>) => void
  setStatus: (
    provider: WalletProviderType | null,
    status: WalletProviderStatus,
  ) => void
  getStatus: (provider: WalletProviderType | null) => WalletProviderStatus
  markRecent: (provider: WalletProviderType) => void
  getProviders: (mode: WalletMode) => WalletProviderEntry[]
  getConnectedProviders: (mode: WalletMode) => WalletProviderEntry[]
  setError: (error: string) => void
  disconnect: (provider?: WalletProviderType) => void
}

const initialState: WalletProviderState = {
  open: false,
  providers: [],
  recentProvider: null,
  recentlyUsedProviders: [],
  account: null,
  accounts: [],
  mode: WalletMode.Default,
  error: "",
  meta: null,
}

export const useWeb3Connect = create<WalletProviderStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      toggle: (mode, meta) =>
        set((state) => {
          const isValidMode = mode && Object.values(WalletMode).includes(mode)
          return {
            ...state,
            mode: isValidMode ? mode : WalletMode.Default,
            open: !state.open,
            meta: meta ?? null,
          }
        }),
      setAccounts: (accounts, type) =>
        set((state) => {
          const otherAccounts = state.accounts.filter(
            (a) => a.provider !== type,
          )

          const newAccounts = uniqueBy(
            [...otherAccounts, ...accounts],
            getUniqueAccountKey,
          )

          return {
            ...state,
            accounts: newAccounts,
          }
        }),
      setAccount: (account) => {
        const shouldDeactivateExternal =
          !account || account.provider !== WalletProviderType.ExternalWallet

        if (account) {
          const wallet = getWallet(account.provider)
          if (wallet instanceof BaseSubstrateWallet) {
            // For multisig accounts, sign with the signer address, not the multisig address.
            const signerAddress = account.isMultisig
              ? (account.multisigSignerAddress ?? account.address)
              : account.address
            wallet.setSigner(signerAddress)
          }
        }

        if (shouldDeactivateExternal) {
          updateQueryString("account", undefined)
          const externalWallet = getWallet(WalletProviderType.ExternalWallet)
          if (externalWallet instanceof ExternalWallet) {
            externalWallet.disconnect()
          }
        }

        return set((state) => ({
          ...state,
          account,
          ...(shouldDeactivateExternal
            ? {
                providers: state.providers.filter(
                  (p) => p.type !== WalletProviderType.ExternalWallet,
                ),
                accounts: state.accounts.filter(
                  (a) => a.provider !== WalletProviderType.ExternalWallet,
                ),
              }
            : {}),
        }))
      },
      setBalances: (balances) => {
        return set((state) =>
          produce(state, ({ accounts }) => {
            for (const account of accounts) {
              const balance = balances.get(account.publicKey)

              if (balance !== undefined) {
                account.balance = balance
              }
            }
          }),
        )
      },
      setStatus: (provider, status) => {
        const isError = status === WalletProviderStatus.Error
        return set((state) => ({
          ...state,
          providers: provider
            ? [
                ...state.providers.filter((p) => p.type !== provider),
                { type: provider, status },
              ]
            : state.providers,
          recentProvider: provider,
          account: isError ? null : state.account,
          error: isError ? state.error : "",
        }))
      },
      getStatus: (provider) => {
        const foundProvider = get().providers.find((p) => p.type === provider)
        return foundProvider?.status ?? WalletProviderStatus.Disconnected
      },
      markRecent: (provider) =>
        set((state) => ({
          ...state,
          recentlyUsedProviders: uniqueBy(
            [provider, ...state.recentlyUsedProviders],
            (type) => type,
          ).slice(0, RECENT_PROVIDERS_LIMIT),
        })),
      getProviders: (mode: WalletMode) => {
        const { providers } = get()
        const providersByMode = PROVIDERS_BY_WALLET_MODE[mode]
        return providers.filter(
          ({ type }) =>
            !providersByMode.length || providersByMode.includes(type),
        )
      },
      getConnectedProviders: (mode: WalletMode) => {
        const { getProviders } = get()
        const providers = getProviders(mode)
        return providers.filter(
          ({ status }) => status === WalletProviderStatus.Connected,
        )
      },
      setError: (error) => set((state) => ({ ...state, error })),
      disconnect: (givenProvider) => {
        const provider = Object.values(WalletProviderType).find(
          (type) => type === givenProvider,
        )

        set((state) => {
          const isDisconnectingActive =
            !provider || provider === state.account?.provider
          const remainingAccounts = provider
            ? state.accounts.filter((a) => a.provider !== provider)
            : []
          const remainingProviders = provider
            ? state.providers.filter((p) => p.type !== provider)
            : []
          const nextAccount = isDisconnectingActive
            ? (remainingAccounts[0] ?? null)
            : state.account

          if (nextAccount) {
            const wallet = getWallet(nextAccount.provider)
            if (wallet instanceof BaseSubstrateWallet) {
              const signerAddress = nextAccount.isMultisig
                ? (nextAccount.multisigSignerAddress ?? nextAccount.address)
                : nextAccount.address
              wallet.setSigner(signerAddress)
            }
          }

          return {
            ...state,
            ...initialState,
            account: nextAccount,
            accounts: remainingAccounts,
            providers: remainingProviders,
            recentProvider: null,
            recentlyUsedProviders: state.recentlyUsedProviders,
            mode: state.mode,
            open: state.open,
          }
        })
      },
    }),
    {
      name: "web3-connect",
      partialize: omit(["open", "error", "accounts", "mode", "meta"]),
      version: 11,
      // v11: seed MRU from recentProvider + recentlyDisconnectedProviders.
      migrate: (persisted, version) => {
        if (version >= 11) return persisted as WalletProviderStore

        const { recentlyDisconnectedProviders, ...state } = (persisted ??
          {}) as WalletProviderStore & {
          recentlyDisconnectedProviders?: WalletProviderType[]
        }

        return {
          ...state,
          recentlyUsedProviders: uniqueBy(
            [
              ...(state.recentProvider ? [state.recentProvider] : []),
              ...(recentlyDisconnectedProviders ?? []),
            ],
            (type) => type,
          ).slice(0, RECENT_PROVIDERS_LIMIT),
        }
      },
    },
  ),
)
