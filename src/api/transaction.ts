import { SubmittableExtrinsic } from "@polkadot/api/promise/types"
import { useAccount, useWallet } from "sections/web3-connect/Web3Connect.utils"
import { AccountId32 } from "@polkadot/types/interfaces"
import { useMutation, useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { Maybe, undefinedNoop } from "utils/helpers"
import { ApiPromise } from "@polkadot/api"
import { useRpcProvider } from "providers/rpcProvider"
import { isEvmAccount } from "utils/evm"
import { BN_0, BN_1 } from "utils/constants"
import {
  EthereumSigner,
  PermitResult,
} from "sections/web3-connect/signer/EthereumSigner"
import { create } from "zustand"
import BigNumber from "bignumber.js"
import { useSpotPrice } from "api/spotPrice"
import { useAccountCurrency } from "api/payments"
import { useMemo } from "react"
import { createSubscanLink } from "utils/formatting"
import { useAssets } from "providers/assets"

const getPaymentInfo =
  (tx: SubmittableExtrinsic, account: AccountId32 | string) => async () => {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo
  }

export function usePaymentInfo(tx: SubmittableExtrinsic, disabled?: boolean) {
  const { account } = useAccount()
  const finalAccount = account?.address

  return useQuery(
    QUERY_KEYS.paymentInfo(tx.hash, finalAccount),
    finalAccount != null ? getPaymentInfo(tx, finalAccount) : undefinedNoop,
    { enabled: !!finalAccount && !disabled },
  )
}

export function useMultiplePaymentInfo(
  txs: SubmittableExtrinsic[],
  disabled?: boolean,
) {
  const { account } = useAccount()
  const finalAccount = account?.address

  const queries = txs.map((tx) => ({
    queryKey: QUERY_KEYS.paymentInfo(tx.hash, finalAccount),
    queryFn:
      finalAccount != null ? getPaymentInfo(tx, finalAccount) : undefinedNoop,
    enabled: !!finalAccount && !disabled,
  }))

  return useQueries({ queries })
}

export function useNextEvmPermitNonce() {
  const { account } = useAccount()
  const address = account?.address
  const { wallet } = useWallet()
  const {
    permitNonce,
    pendingPermit,
    setPermitNonce,
    incrementPermitNonce,
    revertPermitNonce,
    setPendingPermit,
  } = useEvmPermitStore()

  const isEvmSigner = wallet?.signer instanceof EthereumSigner

  useQuery(
    QUERY_KEYS.nextEvmPermitNonce(address),
    async () => {
      if (!address) throw new Error("Missing address")
      if (!wallet?.signer) throw new Error("Missing wallet signer")
      if (!isEvmSigner) throw new Error("Invalid signer")
      return await wallet.signer.getPermitNonce()
    },
    {
      enabled: isEvmAccount(address) && isEvmSigner,
      cacheTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 24,
      onSuccess: (nonce) => {
        if (nonce) {
          setPermitNonce(nonce)
        }
      },
    },
  )

  return {
    permitNonce,
    pendingPermit,
    incrementPermitNonce,
    revertPermitNonce,
    setPendingPermit,
  }
}

export function useNextNonce(account: Maybe<AccountId32 | string>) {
  const { api } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.nextNonce(account),
    account != null
      ? async () => {
          if (!account) throw new Error("Missing address")
          return await api.rpc.system.accountNextIndex(account)
        }
      : undefinedNoop,
    { enabled: !!account },
  )
}

export function useTransactionLink() {
  const { api } = useRpcProvider()
  return useMutation(
    async ({
      blockHash,
      txIndex,
    }: {
      blockHash?: string
      txIndex?: string
    }) => {
      if (!(blockHash && txIndex)) {
        return undefined
      }
      return getTransactionLinkFromHash(api, blockHash, txIndex)
    },
  )
}

export async function getTransactionLinkFromHash(
  api: ApiPromise,
  blockHash: string,
  txIndex: string,
) {
  try {
    const { block } = await api.rpc.chain.getBlock(blockHash)
    const blockNumber = block.header.number.toString()

    if (blockNumber) {
      return createSubscanLink("extrinsic", `${blockNumber}-${txIndex}`)
    }

    return undefined
  } catch (err) {
    return undefined
  }
}

export const useEvmPermitStore = create<{
  pendingPermit: PermitResult | null
  permitNonce: BigNumber
  setPermitNonce: (nonce: BigNumber) => void
  setPendingPermit: (permit: PermitResult | null) => void
  revertPermitNonce: () => void
  incrementPermitNonce: () => void
}>((set) => ({
  pendingPermit: null,
  permitNonce: BN_0,
  setPermitNonce: (nonce: BigNumber) => set({ permitNonce: nonce }),
  setPendingPermit: (permit) => set({ pendingPermit: permit }),
  revertPermitNonce: () =>
    set((state) => ({ permitNonce: state.permitNonce.minus(1) })),
  incrementPermitNonce: () =>
    set((state) => ({ permitNonce: state.permitNonce.plus(1) })),
}))

export const useEstimatedFees = (txs: SubmittableExtrinsic[]) => {
  const { getAsset, native } = useAssets()
  const { account } = useAccount()

  const accountCurrency = useAccountCurrency(account?.address)
  const accountCurrencyMeta = accountCurrency.data
    ? getAsset(accountCurrency.data)
    : undefined

  const nativeId = native.id
  const nativeDecimals = native.decimals
  const accountCurrencyId = accountCurrencyMeta?.id
  const accountCurrencyDecimals = accountCurrencyMeta?.decimals ?? 0

  const decimalsDiff =
    nativeDecimals - (accountCurrencyDecimals || nativeDecimals)

  const spotPrice = useSpotPrice(nativeId, accountCurrencyId)

  const fees = useMultiplePaymentInfo(txs)

  return useMemo(() => {
    const defaultFees = {
      nativeFee: BN_0,
      nativeFeeDisplay: BN_0,
      accountCurrencyFee: BN_0,
      accountCurrencyFeeDisplay: BN_0,
      accountCurrencyId,
    }

    if (fees.some(({ data }) => !data) || !spotPrice.data) {
      return defaultFees
    }

    return fees.reduce((prev, curr) => {
      const price = spotPrice.data.spotPrice ?? BN_1

      const nativeFee = curr?.data?.partialFee?.toBigNumber() ?? BN_0
      const nativeFeeTotal = nativeFee.plus(prev.nativeFee)

      const accountCurrencyFee = nativeFee
        .multipliedBy(price)
        .shiftedBy(-decimalsDiff)
        .decimalPlaces(0, BigNumber.ROUND_CEIL)

      const accountCurrencyFeeTotal = accountCurrencyFee.plus(
        prev.accountCurrencyFee,
      )

      return {
        ...prev,
        nativeFee: nativeFeeTotal,
        nativeFeeDisplay: nativeFeeTotal.shiftedBy(-nativeDecimals),
        accountCurrencyFee: accountCurrencyFeeTotal,
        accountCurrencyFeeDisplay: accountCurrencyFeeTotal.shiftedBy(
          -accountCurrencyDecimals,
        ),
      }
    }, defaultFees)
  }, [
    accountCurrencyDecimals,
    accountCurrencyId,
    decimalsDiff,
    fees,
    nativeDecimals,
    spotPrice.data,
  ])
}
