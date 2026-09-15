import { ExtendedEvmCall } from "@galacticcouncil/money-market/types"
import { safeConvertSS58toH160, safeStringify } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { CallType } from "@galacticcouncil/xc-core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  type Abi,
  encodeFunctionData,
  erc20Abi,
  type Hex,
  parseUnits,
} from "viem"

import { evmAccountBindingQuery } from "@/api/evm"
import { VAULT_ABI } from "@/modules/strategies/propeller/config/abi"
import { EVM_CALL_GAS } from "@/modules/strategies/propeller/constants"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { transformEvmCallToPapiTx } from "@/modules/transactions/utils/tx"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTransactionsStore } from "@/states/transactions"

interface BatchEvmCall {
  to: Hex
  data: Hex
  abi: Abi
}

function useVaultEvmCall() {
  const rpc = useRpcProvider()

  const { account } = useAccount()
  const { createTransaction } = useTransactionsStore()
  const queryClient = useQueryClient()

  const address = account?.address ?? ""
  const evmAddress = safeConvertSS58toH160(address) as Hex

  const { data: isBound } = useQuery(evmAccountBindingQuery(rpc, address))

  const submitTx = useCallback(
    async (
      to: Hex,
      data: Hex,
      abi: Abi,
      toasts: { submitted: string; success: string },
    ) => {
      const gasPriceBase = await rpc.evm.getGasPrice()
      const gasPriceSurplus = (gasPriceBase * 5n) / 100n // 5% surplus
      const gasPrice = gasPriceBase + gasPriceSurplus

      const evmCall: ExtendedEvmCall = {
        from: evmAddress,
        to,
        data,
        type: CallType.Evm,
        dryRun: (() => Promise.resolve(undefined)) as () => Promise<undefined>,
        gasLimit: EVM_CALL_GAS,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
        abi: safeStringify(abi),
      }

      // Batch bind + evm call when the account is not yet mapped to EVM.
      if (isBound === false) {
        const bindTx = rpc.papi.tx.EVMAccounts.bind_evm_address()
        const evmPapiTx = transformEvmCallToPapiTx(rpc.papi, evmCall)
        const batchTx = rpc.papi.tx.Utility.batch_all({
          calls: [bindTx.decodedCall, evmPapiTx.decodedCall],
        })

        return createTransaction(
          { tx: batchTx, toasts },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["propeller-vault"] })
              queryClient.invalidateQueries(
                evmAccountBindingQuery(rpc, address),
              )
            },
          },
        )
      }

      return createTransaction(
        { tx: evmCall, toasts },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["propeller-vault"] })
          },
        },
      )
    },
    [evmAddress, isBound, rpc, address, createTransaction, queryClient],
  )

  /**
   * Submit EVM calls as one substrate Utility.batch_all.
   * Prepends bind_evm_address when the account is not yet mapped.
   */
  const submitBatch = useCallback(
    async (
      calls: BatchEvmCall[],
      toasts: { submitted: string; success: string },
      invalidateKeys: string[][] = [["propeller-vault"]],
    ) => {
      if (calls.length === 0) {
        throw new Error("submitBatch called with no calls")
      }

      const gasPriceBase = await rpc.evm.getGasPrice()
      const gasPriceSurplus = (gasPriceBase * 5n) / 100n // 5% surplus
      const gasPrice = gasPriceBase + gasPriceSurplus

      const evmCalls = calls.map(({ to, data, abi }) => ({
        from: evmAddress,
        to,
        data,
        type: CallType.Evm,
        dryRun: (() => Promise.resolve(undefined)) as () => Promise<undefined>,
        gasLimit: EVM_CALL_GAS,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
        abi: safeStringify(abi),
      }))

      const papiCalls = evmCalls.map(
        (c) => transformEvmCallToPapiTx(rpc.papi, c).decodedCall,
      )

      const batchInner =
        isBound === false
          ? [
              rpc.papi.tx.EVMAccounts.bind_evm_address().decodedCall,
              ...papiCalls,
            ]
          : papiCalls

      const batchTx = rpc.papi.tx.Utility.batch_all({ calls: batchInner })

      return createTransaction(
        { tx: batchTx, toasts },
        {
          onSuccess: () => {
            for (const k of invalidateKeys) {
              queryClient.invalidateQueries({ queryKey: k })
            }
            if (isBound === false) {
              queryClient.invalidateQueries(
                evmAccountBindingQuery(rpc, address),
              )
            }
          },
        },
      )
    },
    [evmAddress, isBound, rpc, address, createTransaction, queryClient],
  )

  return { evmAddress, submitTx, submitBatch }
}

export function useDeposit() {
  const { t } = useTranslation(["common"])
  const { evm } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()
  const { evmAddress, submitBatch } = useVaultEvmCall()
  const { vaultAddress, assetAddress, assetId, symbol } =
    useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals

  return useMutation({
    mutationFn: async (assetAmount: string) => {
      const assetBig = parseUnits(assetAmount, decimals)
      const calls: BatchEvmCall[] = []

      const assetAllowance = await evm.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [evmAddress, vaultAddress],
      })

      if (assetAllowance < assetBig) {
        calls.push({
          to: assetAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [vaultAddress, assetBig],
          }),
          abi: [...erc20Abi],
        })
      }

      calls.push({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [assetBig, evmAddress],
        }),
        abi: [...VAULT_ABI],
      })

      const fmt = t("currency", {
        value: assetAmount,
        symbol,
        maximumFractionDigits: 4,
      })
      return submitBatch(calls, {
        submitted: `Depositing ${fmt}...`,
        success: `${fmt} deposited`,
      })
    },
  })
}

export function useRequestRedeem() {
  const { t } = useTranslation(["common"])
  const { getAssetWithFallback } = useAssets()
  const { evmAddress, submitTx } = useVaultEvmCall()
  const { vaultAddress, assetId, shareSymbol } = useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals

  return useMutation({
    mutationFn: (shareAmount: number) => {
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "requestRedeem",
        args: [parseUnits(shareAmount.toString(), decimals), evmAddress],
      })

      const fmt = t("currency", {
        value: shareAmount,
        symbol: shareSymbol,
        maximumFractionDigits: 4,
      })
      return submitTx(vaultAddress, data, [...VAULT_ABI], {
        submitted: `Requesting ${fmt} withdrawal...`,
        success: `${fmt} withdrawal requested`,
      })
    },
  })
}

export function useClaim() {
  const { evmAddress, submitTx } = useVaultEvmCall()
  const { vaultAddress, symbol } = useActivePropellerVault()

  return useMutation({
    mutationFn: (requestId: number) => {
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "claim",
        args: [BigInt(requestId), evmAddress],
      })
      return submitTx(vaultAddress, data, [...VAULT_ABI], {
        submitted: `Claiming ${symbol}...`,
        success: "Claim sent",
      })
    },
  })
}
