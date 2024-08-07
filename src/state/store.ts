import { create } from "zustand"
import { persist } from "zustand/middleware"
import { SubmittableExtrinsic } from "@polkadot/api/promise/types"
import { ISubmittableResult } from "@polkadot/types/types"
import { v4 as uuid } from "uuid"
import { ReactElement } from "react"
import BigNumber from "bignumber.js"
import { StepProps } from "components/Stepper/Stepper"
import { XCallEvm } from "@galacticcouncil/xcm-sdk"

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
  description?: string
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
