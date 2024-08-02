import { create } from "zustand"
import { StateStorage, createJSONStorage, persist } from "zustand/middleware"
import { SubmittableExtrinsic } from "@polkadot/api/promise/types"
import { ISubmittableResult } from "@polkadot/types/types"
import { v4 as uuid } from "uuid"
import { ReactElement } from "react"
import BigNumber from "bignumber.js"
import { StepProps } from "components/Stepper/Stepper"
import { XCallEvm } from "@galacticcouncil/xcm-sdk"
import { arraysEqual } from "utils/helpers"
import { Asset } from "@galacticcouncil/sdk"

export interface ToastMessage {
  onLoading?: ReactElement
  onSuccess?: ReactElement
  onError?: ReactElement
}

export interface Account {
  name: string
  address: string
  provider: string
  isExternalWalletConnected: boolean
  delegate?: string
}

export interface TransactionInput {
  title?: string
  tx?: SubmittableExtrinsic
  xcall?: XCallEvm
  xcallMeta?: Record<string, string>
  overrides?: {
    fee: BigNumber
    currencyId?: string
    feeExtra?: BigNumber
  }
}

export interface Transaction extends TransactionInput {
  id: string
  onSuccess?: (result: ISubmittableResult) => void
  onSubmitted?: () => void
  onError?: () => void
  toastMessage?: ToastMessage
  isProxy: boolean
  steps?: Array<StepProps>
  onBack?: () => void
  onClose?: () => void
}

interface Store {
  transactions?: Transaction[]
  createTransaction: (
    transaction: TransactionInput,
    options?: {
      onSuccess?: (result: ISubmittableResult) => void
      onSubmitted?: () => void
      toast?: ToastMessage
      isProxy?: boolean
      steps?: Array<StepProps>
      onBack?: () => void
      onClose?: () => void
    },
  ) => Promise<ISubmittableResult>
  cancelTransaction: (hash: string) => void
}

type RpcStore = {
  rpcList: Array<{
    name?: string
    url: string
  }>
  addRpc: (account: string) => void
  removeRpc: (url: string) => void
  renameRpc: (url: string, newName: string) => void
}

export const useStore = create<Store>((set) => ({
  createTransaction: (transaction, options) => {
    return new Promise<ISubmittableResult>((resolve, reject) => {
      set((store) => {
        return {
          transactions: [
            {
              ...transaction,
              id: uuid(),
              toastMessage: {
                onLoading: options?.toast?.onLoading,
                onSuccess: options?.toast?.onSuccess,
                onError: options?.toast?.onError,
              },
              onSubmitted: () => {
                options?.onSubmitted?.()
              },
              onSuccess: (value) => {
                resolve(value)
                options?.onSuccess?.(value)
              },
              onError: () => reject(new Error("Transaction rejected")),
              isProxy: !!options?.isProxy,
              steps: options?.steps,
              onBack: options?.onBack,
              onClose: options?.onClose,
            },
            ...(store.transactions ?? []),
          ],
        }
      })
    })
  },
  cancelTransaction: (id) => {
    set((store) => ({
      transactions: store.transactions?.filter(
        (transaction) => transaction.id !== id,
      ),
    }))
  },
}))

export const useRpcStore = create<RpcStore>()(
  persist(
    (set) => ({
      rpcList: [],

      addRpc: (url) =>
        set((store) => ({ rpcList: [...store.rpcList, { url }] })),
      removeRpc: (urlToRemove) =>
        set((store) => ({
          rpcList: store.rpcList.filter((rpc) => rpc.url !== urlToRemove),
        })),
      renameRpc: (urlToRename, name) =>
        set((store) => ({
          rpcList: store.rpcList.map((rpc) =>
            rpc.url === urlToRename ? { ...rpc, name } : rpc,
          ),
        })),
    }),
    {
      name: "hydradx-rpc-list",
    },
  ),
)

export type TAssetStored = Omit<Asset, "externalId"> & {
  isTradable: boolean
  externalId: string | undefined
}
export type TShareTokenStored = {
  poolAddress: string
  assets: string[]
  shareTokenId: string
}

type AssetRegistryStore = {
  assets: Array<TAssetStored>
  shareTokens: Array<TShareTokenStored>
  sync: (assets: TAssetStored[]) => void
  syncShareTokens: (shareTokens: TShareTokenStored[]) => void
}

export enum IndexedDBStores {
  Assets = "assets",
}

const db: IDBDatabase | null = await new Promise((resolve) => {
  const request = indexedDB.open("storage")

  request.onsuccess = () => resolve(request.result)

  request.onupgradeneeded = () => {
    const db = request.result

    if (!db.objectStoreNames.contains(IndexedDBStores.Assets)) {
      db.createObjectStore(IndexedDBStores.Assets, { keyPath: "key" })
    }
  }

  request.onerror = () => resolve(null)
})

type StoreKey = "tokens" | "shareTokens"

const getItems = async (
  db: IDBDatabase,
): Promise<{ tokens: object[]; shareTokens: object[] }> =>
  await new Promise((resolve) => {
    const tx = db.transaction(IndexedDBStores.Assets, "readonly")
    const store = tx.objectStore(IndexedDBStores.Assets)
    const res = store.getAll()

    res.onsuccess = () => {
      const data = res.result
      const tokens = data.find((e) => e.key === "tokens")?.data ?? []
      const shareTokens = data.find((e) => e.key === "shareTokens")?.data ?? []

      resolve({ tokens, shareTokens })
    }
  })

const setItems = async (db: IDBDatabase, data: object[], key: StoreKey) =>
  await new Promise((resolve) => {
    const tx = db.transaction(IndexedDBStores.Assets, "readwrite")
    const store = tx.objectStore(IndexedDBStores.Assets)
    store.put({ key, data })

    resolve(data)
  })

const storage: StateStorage = {
  getItem: async () => {
    const storage = await db
    if (!storage) return null

    const { tokens, shareTokens } = await getItems(storage)

    return JSON.stringify({
      version: 0,
      state: { assets: tokens, shareTokens },
    })
  },
  setItem: async (_, value) => {
    const parsedState = JSON.parse(value)
    const storage = await db

    if (storage) {
      const { tokens, shareTokens } = await getItems(storage)

      const areTokensEqual = arraysEqual(parsedState.state.assets, tokens)
      const areShareTokensEqual = arraysEqual(
        parsedState.state.shareTokens,
        shareTokens,
      )

      if (!areTokensEqual) {
        setItems(storage, parsedState.state.assets, "tokens")
      }

      if (!areShareTokensEqual) {
        setItems(storage, parsedState.state.shareTokens, "shareTokens")
      }
    }
  },
  removeItem: () => {},
}

export const useAssetRegistry = create<AssetRegistryStore>()(
  persist(
    (set) => ({
      assets: [],
      shareTokens: [],
      sync(assets) {
        set({
          assets,
        })
      },
      syncShareTokens(shareTokens) {
        set({
          shareTokens,
        })
      },
    }),
    {
      name: "asset-registry",
      storage: createJSONStorage(() => storage),
    },
  ),
)

type SettingsStore = {
  degenMode: boolean
  toggleDegenMode: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      degenMode: false,
      toggleDegenMode: () => set((store) => ({ degenMode: !store.degenMode })),
    }),
    {
      name: "settings",
      version: 1,
    },
  ),
)
