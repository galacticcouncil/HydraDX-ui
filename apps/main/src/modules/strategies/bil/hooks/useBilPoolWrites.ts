import { ProtocolAction } from "@aave/contract-helpers"
import { ExtendedEvmCall } from "@galacticcouncil/money-market/types"
import { safeConvertSS58toH160 } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { CallType } from "@galacticcouncil/xc-core"
import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { encodeFunctionData, type Hex, maxUint256, parseUnits } from "viem"

import { estimateGasLimit } from "@/api/borrow"
import { BIL_POOL_ABI } from "@/modules/strategies/bil/config/abi"
import {
  AAVE_INTEREST_RATE_MODE_VARIABLE,
  BIL_POOL_ADDRESS,
  HOLLAR_ADDRESS,
} from "@/modules/strategies/bil/config/constants"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { BIL_QUERY_KEY_PREFIX } from "@/modules/strategies/bil/utils/queryKeys"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTransactionsStore } from "@/states/transactions"

type BilPoolWriteOptions = {
  onClose?: () => void
}

type PoolWriteFunction = "borrow" | "repay"

const getPoolFunctionAbi = (functionName: PoolWriteFunction) =>
  JSON.stringify(
    BIL_POOL_ABI.filter(
      (item) => item.type === "function" && item.name === functionName,
    ),
  )

function useBilPoolEvmCall({ onClose }: BilPoolWriteOptions = {}) {
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const { createTransaction } = useTransactionsStore()

  const evmAddress = safeConvertSS58toH160(account?.address ?? "") as Hex

  const submitTx = useCallback(
    async (
      data: Hex,
      protocolAction: ProtocolAction,
      functionName: PoolWriteFunction,
      toasts: { submitted: string; success: string },
    ) => {
      const { gasLimit, maxFeePerGas, maxPriorityFeePerGas } =
        await estimateGasLimit({
          evm: rpc.evm,
          action: protocolAction,
        })

      const evmCall: ExtendedEvmCall = {
        from: evmAddress,
        to: BIL_POOL_ADDRESS,
        data,
        type: CallType.Evm,
        dryRun: (() => Promise.resolve(undefined)) as () => Promise<undefined>,
        gasLimit,
        maxFeePerGas: maxFeePerGas[0],
        maxPriorityFeePerGas: maxPriorityFeePerGas[0],
        abi: getPoolFunctionAbi(functionName),
      }

      return createTransaction(
        {
          tx: evmCall,
          toasts,
          invalidateQueries: [[BIL_QUERY_KEY_PREFIX]],
        },
        {
          onSubmitted: onClose,
        },
      )
    },
    [createTransaction, evmAddress, onClose, rpc.evm],
  )

  return { evmAddress, submitTx }
}

/**
 * Borrow HOLLAR against the user's BIL collateral on the BIL Aave pool.
 *
 * Uses interestRateMode=2 (variable) — the GhoAToken facilitator rejects
 * stable-rate borrows, and stable-rate has been deprecated across Aave V3
 * generally.
 */
export function useBorrowHollar({ onClose }: BilPoolWriteOptions = {}) {
  const { t } = useTranslation(["strategies", "common"])
  const { hollar } = useBilStrategy()
  const { evmAddress, submitTx } = useBilPoolEvmCall({ onClose })

  return useMutation({
    mutationFn: (hollarAmount: string) => {
      const data = encodeFunctionData({
        abi: BIL_POOL_ABI,
        functionName: "borrow",
        args: [
          HOLLAR_ADDRESS,
          parseUnits(hollarAmount, hollar.decimals),
          AAVE_INTEREST_RATE_MODE_VARIABLE,
          0, // referralCode
          evmAddress,
        ],
      })

      return submitTx(data, ProtocolAction.borrow, "borrow", {
        submitted: t("bil.borrow.toast.submitted", {
          amount: hollarAmount,
          symbol: hollar.symbol,
        }),
        success: t("bil.borrow.toast.success", {
          amount: hollarAmount,
          symbol: hollar.symbol,
        }),
      })
    },
  })
}

/**
 * Repay HOLLAR debt on the BIL Aave pool.
 *
 * Mirrors `useBorrowHollar` — single `pool.repay(asset, amount, mode, onBehalfOf)`
 * EVM call routed through the project's transaction store. Uses variable rate
 * mode (=2) to match the borrow side. When repaying the full debt, pass
 * `repayAll: true` so the call uses `maxUint256` (Aave's "repay everything"
 * sentinel) instead of a fixed wei amount that may drift with accrued interest.
 */
export function useRepayHollar({ onClose }: BilPoolWriteOptions = {}) {
  const { t } = useTranslation(["strategies", "common"])
  const { hollar } = useBilStrategy()
  const { evmAddress, submitTx } = useBilPoolEvmCall({ onClose })

  return useMutation({
    mutationFn: ({
      amount,
      repayAll,
    }: {
      amount: string
      repayAll?: boolean
    }) => {
      const data = encodeFunctionData({
        abi: BIL_POOL_ABI,
        functionName: "repay",
        args: [
          HOLLAR_ADDRESS,
          repayAll ? maxUint256 : parseUnits(amount, hollar.decimals),
          AAVE_INTEREST_RATE_MODE_VARIABLE,
          evmAddress,
        ],
      })

      return submitTx(data, ProtocolAction.repay, "repay", {
        submitted: t("bil.repay.toast.submitted", {
          amount,
          symbol: hollar.symbol,
        }),
        success: t("bil.repay.toast.success", {
          amount,
          symbol: hollar.symbol,
        }),
      })
    },
  })
}
