import { HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { CallType } from "@galacticcouncil/xc-core"
import { useQueryClient } from "@tanstack/react-query"
import Big from "big.js"
import { createContext, useCallback, useContext, useReducer } from "react"
import { useLatest } from "react-use"

import { MAX_WITHDRAW_ALL_QUERY_KEY } from "@/api/balances"
import { useEstimateFee } from "@/modules/transactions/hooks/useEstimateFee"
import { useNonce } from "@/modules/transactions/hooks/useNonce"
import { useSignAndSubmit } from "@/modules/transactions/hooks/useSignAndSubmit"
import { useTransactionEcosystem } from "@/modules/transactions/hooks/useTransactionEcosystem"
import { useTransactionPaymentInfo } from "@/modules/transactions/hooks/useTransactionPaymentInfo"
import { useTransactionTip } from "@/modules/transactions/hooks/useTransactionTip"
import { useTransactionToasts } from "@/modules/transactions/hooks/useTransactionToasts"
import { useWrapTransaction } from "@/modules/transactions/hooks/useWrapTransaction"
import {
  doClose,
  doReset,
  doSetChangingFeePaymentAsset,
  doSetError,
  doSetFeePaymentModalOpen,
  doSetStatus,
  doSetTip,
  doSign,
  INITIAL_STATUS,
  transactionStatusReducer,
} from "@/modules/transactions/TransactionProvider.utils"
import { TxState, TxStatus } from "@/modules/transactions/types"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useNeckworkSyncStore } from "@/states/neckwork"
import { useProviderRpcUrlStore } from "@/states/provider"
import {
  getTxResultBlockHeight,
  SingleTransaction,
  useTransactionsStore,
} from "@/states/transactions"
import { NATIVE_ASSET_ID } from "@/utils/consts"

export type TransactionContext = SingleTransaction &
  TxState & {
    isIdle: boolean
    isSubmitted: boolean
    isSuccess: boolean
    isError: boolean

    ecosystem: CallType

    nonce: number
    isLoadingNonce: boolean

    feeEstimateNative?: string
    feeEstimate?: string
    feeAssetBalance?: string
    feeAssetId: string
    isLoadingFeeEstimate: boolean

    isLoading: boolean
    isUsingPermit: boolean

    setTip: (tip: string) => void
    setStatus: (status: TxStatus) => void
    setFeePaymentModalOpen: (open: boolean) => void
    setIsChangingFeePaymentAsset: (value: boolean) => void
    signAndSubmit: () => void
    reset: () => void
  }

const TransactionContext = createContext<TransactionContext>(
  {} as TransactionContext,
)

export const useTransaction = () => useContext(TransactionContext)

export type TransactionProviderProps = {
  children: React.ReactNode
  transaction: SingleTransaction
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({
  children,
  transaction: config,
}) => {
  const queryClient = useQueryClient()
  const rpcUrl = useProviderRpcUrlStore((state) => state.rpcUrl)
  const { isFork } = useRpcProvider()
  const armNeckworkSync = useNeckworkSyncStore((state) => state.arm)
  const { cancelTransaction, addPendingTransaction, removePendingTransaction } =
    useTransactionsStore()
  const { account } = useAccount()

  const hasInitialError = !!config.initialError
  const transaction = useWrapTransaction(config)

  const [state, dispatch] = useReducer(
    transactionStatusReducer,
    config.initialError
      ? {
          ...INITIAL_STATUS,
          status: "error",
          error: config.initialError,
        }
      : INITIAL_STATUS,
  )
  const ecosystem = useTransactionEcosystem(transaction)
  const toasts = useTransactionToasts(transaction, ecosystem)

  const { data: fee, isLoading: isLoadingFeeEstimate } = useEstimateFee(
    !hasInitialError && transaction.meta.srcChainKey === HYDRATION_CHAIN_KEY
      ? transaction.tx
      : null,
    transaction?.fee?.feePaymentAssetId,
  )

  const { data: paymentInfo, isLoading: isLoadingPaymentInfo } =
    useTransactionPaymentInfo(hasInitialError ? undefined : transaction.tx)

  const feeEstimateNative = fee?.feeEstimateNative
  const feeEstimate = fee?.feeEstimate
  const feeAssetId = fee?.feeAssetId ?? NATIVE_ASSET_ID
  const feeAssetBalance =
    transaction.executedAmount &&
    transaction.executedAmount.assetId === feeAssetId
      ? Big.max(
          Big(fee?.feeAssetBalance ?? "0")
            .minus(transaction.executedAmount.amount)
            .toString(),
          "0",
        ).toString()
      : fee?.feeAssetBalance

  const {
    nonce,
    isLoading: isLoadingNonce,
    isUsingPermit,
  } = useNonce(feeAssetId)

  const onClose = useCallback(() => {
    dispatch(doClose())
    cancelTransaction(transaction.id)
    transaction.onClose?.()
  }, [cancelTransaction, transaction])

  const reset = useCallback(() => {
    dispatch(doReset())
  }, [])

  const setStatus = useCallback((status: TxStatus) => {
    dispatch(doSetStatus(status))
  }, [])

  const setTip = useCallback(
    (tip: string) => {
      dispatch(doSetTip(tip))
    },
    [dispatch],
  )

  const setFeePaymentModalOpen = useCallback(
    (open: boolean) => {
      dispatch(doSetFeePaymentModalOpen(open))
    },
    [dispatch],
  )

  const setIsChangingFeePaymentAsset = useCallback(
    (value: boolean) => {
      dispatch(doSetChangingFeePaymentAsset(value))
    },
    [dispatch],
  )

  const signAndSubmitMutation = useSignAndSubmit(transaction, {
    onMutate: () => dispatch(doSign()),
    onError: (err) => doSetError(err.message),
  })

  const openRef = useLatest(state.open)

  const tip = useTransactionTip(state.tip, state.tipAssetId)

  const signAndSubmit = () => {
    signAndSubmitMutation.mutate({
      chainKey: transaction.meta.srcChainKey,
      signerFeeAsset: transaction.signerFeeAsset,
      feeAssetId,
      tip,
      weight: paymentInfo?.weight?.ref_time,
      mortalityPeriod: state.mortalityPeriod,
      nonce:
        !account?.isMultisig &&
        transaction.meta.srcChainKey === HYDRATION_CHAIN_KEY
          ? nonce
          : undefined,
      priorityRpcUrl:
        transaction.meta.srcChainKey === HYDRATION_CHAIN_KEY
          ? rpcUrl
          : undefined,
      onSubmitted: (txHash) => {
        dispatch(doSetStatus("submitted"))
        transaction.onSubmitted?.(txHash)
        toasts.onSubmitted?.(txHash)
        if (account) {
          addPendingTransaction({
            id: transaction.id,
            nonce,
            meta: transaction.meta,
            address: account.address,
            isPermit: isUsingPermit,
          })
        }
      },
      onSuccess: (event) => {
        dispatch(doSetStatus("success"))
        transaction.onSuccess?.(event)
        transaction.invalidateQueries?.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        )
        // the indexer can't have this block yet — arm the sync instead of
        // invalidating the neckwork queries now
        const blockHeight = getTxResultBlockHeight(event)
        if (blockHeight !== null && !isFork) armNeckworkSync(blockHeight)
        queryClient.invalidateQueries({
          queryKey: MAX_WITHDRAW_ALL_QUERY_KEY,
        })
        toasts.onSuccess?.(event)
        removePendingTransaction(transaction.id)
      },
      onError: (message) => {
        dispatch(doSetError(message))
        removePendingTransaction(transaction.id)
        transaction.onError?.(message)

        if (!openRef.current) {
          toasts.onError?.(message)
        }
      },
      onFinalized: () => {
        cancelTransaction(transaction.id)
        removePendingTransaction(transaction.id)
      },
    })
  }

  const isLoading =
    isLoadingNonce || isLoadingFeeEstimate || isLoadingPaymentInfo

  return (
    <TransactionContext.Provider
      value={{
        ...transaction,
        ...state,

        isIdle: state.status === "idle",
        isSubmitted: state.status === "submitted",
        isSuccess: state.status === "success",
        isError: state.status === "error",

        ecosystem,

        nonce,
        isLoadingNonce,

        feeEstimateNative,
        feeEstimate,
        feeAssetBalance,
        feeAssetId,
        isLoadingFeeEstimate,

        isLoading,
        isUsingPermit,

        setTip,
        setFeePaymentModalOpen,
        setIsChangingFeePaymentAsset,
        onClose,
        setStatus,
        signAndSubmit,
        reset,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
