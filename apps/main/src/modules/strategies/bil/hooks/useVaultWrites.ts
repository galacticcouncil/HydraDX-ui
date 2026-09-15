import { ExtendedEvmCall } from "@galacticcouncil/money-market/types"
import { TradeRouteBuilder } from "@galacticcouncil/sdk-next/sor"
import { safeConvertSS58toH160, safeStringify } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { CallType } from "@galacticcouncil/xc-core"
import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  type Abi,
  encodeFunctionData,
  formatUnits,
  type Hex,
  parseUnits,
  zeroAddress,
} from "viem"

import { AAVE_GAS_LIMIT } from "@/api/aave"
import { estimateGasLimit } from "@/api/borrow"
import { calculateSlippage } from "@/api/utils/slippage"
import {
  BIL_DEPOSIT_ZAP_ABI,
  BIL_POOL_ABI,
  ERC20_ABI,
  VAULT_ABI,
} from "@/modules/strategies/bil/config/abi"
import {
  BIL_DEPOSIT_ZAP_ADDRESS,
  BIL_POOL_ADDRESS,
  DCL_PRECOMPILE_ADDRESS,
  EVM_CALL_GAS,
  HOLLAR_ADDRESS,
  VAULT_ADDRESS,
} from "@/modules/strategies/bil/config/constants"
import { useBilStrategy } from "@/modules/strategies/bil/context/BilStrategyContext"
import { BIL_QUERY_KEY_PREFIX } from "@/modules/strategies/bil/utils/queryKeys"
import { transformEvmCallToPapiTx } from "@/modules/transactions/utils/tx"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { useTransactionsStore } from "@/states/transactions"

interface BatchEvmCall {
  to: Hex
  data: Hex
  abi: Abi
}

function buildCancelResupplyCalls(
  requestId: number,
  returnAmount: bigint,
  evmAddress: Hex,
): BatchEvmCall[] {
  return [
    {
      to: VAULT_ADDRESS,
      data: encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "cancelRedeem",
        args: [BigInt(requestId)],
      }),
      abi: [...VAULT_ABI],
    },
    {
      to: BIL_POOL_ADDRESS,
      data: encodeFunctionData({
        abi: BIL_POOL_ABI,
        functionName: "supply",
        args: [DCL_PRECOMPILE_ADDRESS, returnAmount, evmAddress, 0],
      }),
      abi: [...BIL_POOL_ABI],
    },
  ]
}

function useVaultEvmCall() {
  const rpc = useRpcProvider()

  const { account } = useAccount()
  const createTransaction = useTransactionsStore((s) => s.createTransaction)

  const evmAddress = safeConvertSS58toH160(account?.address ?? "") as Hex

  const submitTx = useCallback(
    async (
      to: Hex,
      data: Hex,
      abi: Abi,
      toasts: { submitted: string; success: string },
      invalidateKeys: string[][] = [[BIL_QUERY_KEY_PREFIX]],
    ) => {
      const { gasLimit, maxFeePerGas, maxPriorityFeePerGas } =
        await estimateGasLimit({
          evm: rpc.evm,
          gasLimit: EVM_CALL_GAS.toString(),
        })

      const evmCall: ExtendedEvmCall = {
        from: evmAddress,
        to,
        data,
        type: CallType.Evm,
        dryRun: (() => Promise.resolve(undefined)) as () => Promise<undefined>,
        gasLimit,
        maxFeePerGas: maxFeePerGas[0],
        maxPriorityFeePerGas: maxPriorityFeePerGas[0],
        abi: safeStringify(abi),
      }

      return createTransaction({
        tx: evmCall,
        toasts,
        invalidateQueries: invalidateKeys,
      })
    },
    [evmAddress, rpc, createTransaction],
  )

  const buildBatchCalls = useCallback(
    async (calls: BatchEvmCall[]) => {
      if (calls.length === 0) {
        throw new Error("buildBatchCalls called with no calls")
      }

      const { gasLimit, maxFeePerGas, maxPriorityFeePerGas } =
        await estimateGasLimit({
          evm: rpc.evm,
          gasLimit: EVM_CALL_GAS.toString(),
        })

      const evmCalls = calls.map(({ to, data, abi }) => ({
        from: evmAddress,
        to,
        data,
        type: CallType.Evm,
        dryRun: (() => Promise.resolve(undefined)) as () => Promise<undefined>,
        gasLimit,
        maxFeePerGas: maxFeePerGas[0],
        maxPriorityFeePerGas: maxPriorityFeePerGas[0],
        abi: safeStringify(abi),
      }))

      const papiCalls = evmCalls.map(
        (c) => transformEvmCallToPapiTx(rpc.papi, c).decodedCall,
      )

      return papiCalls
    },
    [evmAddress, rpc],
  )

  const buildBatchTx = useCallback(
    async (calls: BatchEvmCall[]) => {
      const batchInner = await buildBatchCalls(calls)
      return rpc.papi.tx.Utility.batch_all({ calls: batchInner })
    },
    [buildBatchCalls, rpc],
  )

  const submitBatch = useCallback(
    async (
      calls: BatchEvmCall[],
      toasts: { submitted: string; success: string },
      invalidateQueries: string[][] = [[BIL_QUERY_KEY_PREFIX]],
    ) => {
      const batchTx = await buildBatchTx(calls)

      return createTransaction({ tx: batchTx, toasts, invalidateQueries })
    },
    [buildBatchTx, createTransaction],
  )

  return { evmAddress, submitTx, submitBatch, buildBatchTx, buildBatchCalls }
}

/**
 * Deposit HOLLAR and end up holding hDCL.
 *
 * Routes through `BILDepositZap`, which atomically does
 * HOLLAR.transferFrom → vault.deposit → pool.supply and ends with the user
 * holding aBIL (the Aave receipt) as collateral. Batched call:
 * [HOLLAR.approve(zap), zap.depositAndSupply].
 */
export function useDeposit() {
  const { t } = useTranslation(["strategies", "common"])
  const { hollar } = useBilStrategy()
  const { evm } = useRpcProvider()
  const { evmAddress, submitBatch } = useVaultEvmCall()

  return useMutation({
    mutationFn: async (hollarAmount: string) => {
      const hollarBig = parseUnits(hollarAmount, hollar.decimals)
      const calls: BatchEvmCall[] = []

      if (BIL_DEPOSIT_ZAP_ADDRESS === zeroAddress) {
        throw new Error(
          "BILDepositZap address not configured — deploy via " +
            "`npx hardhat deploy-BILDepositZap` and update " +
            "BIL_DEPOSIT_ZAP_ADDRESS in modules/strategies/bil/config/constants.ts",
        )
      }

      const hollarAllowance = await evm.readContract({
        address: HOLLAR_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [evmAddress, BIL_DEPOSIT_ZAP_ADDRESS],
      })

      if (hollarAllowance < hollarBig) {
        calls.push({
          to: HOLLAR_ADDRESS,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [BIL_DEPOSIT_ZAP_ADDRESS, hollarBig],
          }),
          abi: [...ERC20_ABI],
        })
      }

      calls.push({
        to: BIL_DEPOSIT_ZAP_ADDRESS,
        data: encodeFunctionData({
          abi: BIL_DEPOSIT_ZAP_ABI,
          functionName: "depositAndSupply",
          args: [hollarBig],
        }),
        abi: [...BIL_DEPOSIT_ZAP_ABI],
      })

      return submitBatch(
        calls,
        {
          submitted: t("bil.deposit.toast.submitted", {
            amount: hollarAmount,
            symbol: hollar.symbol,
          }),
          success: t("bil.deposit.toast.success", {
            amount: hollarAmount,
            symbol: hollar.symbol,
          }),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}

/**
 * Request a redemption of `bilAmount` hDCL for HOLLAR via the async queue.
 *
 * pool.withdraw burns the user's aBIL into raw BIL, then vault.requestRedeem
 * queues it. Atomic two-call batch.
 */
export function useRequestRedeem() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil } = useBilStrategy()
  const { evmAddress, submitBatch } = useVaultEvmCall()

  return useMutation({
    mutationFn: (bilAmount: string) => {
      const bilBig = parseUnits(bilAmount, bil.decimals)

      const calls: BatchEvmCall[] = []
      calls.push({
        to: BIL_POOL_ADDRESS,
        data: encodeFunctionData({
          abi: BIL_POOL_ABI,
          functionName: "withdraw",
          args: [DCL_PRECOMPILE_ADDRESS, bilBig, evmAddress],
        }),
        abi: [...BIL_POOL_ABI],
      })
      calls.push({
        to: VAULT_ADDRESS,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "requestRedeem",
          args: [bilBig, evmAddress, evmAddress],
        }),
        abi: [...VAULT_ABI],
      })

      return submitBatch(
        calls,
        {
          submitted: t("bil.withdraw.toast.submitted", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
          success: t("bil.withdraw.toast.success", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}

/**
 * Recovery: user has raw BIL sitting in their wallet and wants to supply it
 * as Aave collateral. Single call — Hydration's pool pulls substrate-asset
 * collateral via the precompile without an ERC20 approve gate.
 *
 *   POOL.supply(PRECOMPILE, amount, user, 0)
 */
export function useSupplyRawBil() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil } = useBilStrategy()
  const { evm } = useRpcProvider()
  const { evmAddress, submitTx } = useVaultEvmCall()

  return useMutation({
    mutationFn: async (bilAmountHint: string) => {
      const bilBig = await evm.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: [evmAddress],
      })

      if (bilBig === 0n) {
        throw new Error("No raw BIL balance to supply")
      }

      const data = encodeFunctionData({
        abi: BIL_POOL_ABI,
        functionName: "supply",
        args: [DCL_PRECOMPILE_ADDRESS, bilBig, evmAddress, 0],
      })

      return submitTx(BIL_POOL_ADDRESS, data, [...BIL_POOL_ABI], {
        submitted: t("bil.supply.toast.submitted", {
          amount: bilAmountHint,
          symbol: bil.symbol,
        }),
        success: t("bil.supply.toast.success", {
          amount: bilAmountHint,
          symbol: bil.symbol,
        }),
      })
    },
  })
}

/**
 * Direct vault redeem-request when the user already holds raw hDCL —
 * `useRequestRedeem` minus the pool.withdraw leg, for the "raw BIL in
 * wallet" recovery row. `requestRedeem(shares, controller, owner)` — the
 * caller's EVM address fills both controller and owner.
 */
export function useRequestRedeemRaw() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil } = useBilStrategy()
  const { evmAddress, submitTx } = useVaultEvmCall()

  return useMutation({
    mutationFn: (bilAmount: string) => {
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "requestRedeem",
        args: [parseUnits(bilAmount, bil.decimals), evmAddress, evmAddress],
      })

      return submitTx(
        VAULT_ADDRESS,
        data,
        [...VAULT_ABI],
        {
          submitted: t("bil.withdraw.toast.submitted", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
          success: t("bil.withdraw.toast.success", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}

/**
 * Cancel a queued redemption request.
 *
 * Cancel returns the unsettled hDCL to the user's wallet, then a follow-up
 * `pool.supply` re-supplies it as aBIL collateral. The 5-tuple from
 * `getRedemptionRequest` is used to size the resupply: the "still queued"
 * portion = bilAmount - bilSettled. The settled portion stays claimable via
 * `redeem` / `withdraw` and is NOT returned by cancel.
 */
export function useCancelRedeem() {
  const { t } = useTranslation(["strategies"])
  const { evm } = useRpcProvider()
  const { evmAddress, submitBatch } = useVaultEvmCall()

  return useMutation({
    mutationFn: async (requestId: number) => {
      const [, bilAmount, bilSettled, , active] = await evm.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getRedemptionRequest",
        args: [BigInt(requestId)],
      })

      if (!active) {
        throw new Error(
          `Redemption request ${requestId} is no longer active (already fulfilled or cancelled)`,
        )
      }

      const returnAmount = bilAmount - bilSettled

      const calls = buildCancelResupplyCalls(
        requestId,
        returnAmount,
        evmAddress,
      )

      return submitBatch(
        calls,
        {
          submitted: t("bil.cancelRedeem.toast.submitted"),
          success: t("bil.cancelRedeem.toast.success"),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}

export function useInstantRedeemFromQueue() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil, hollar } = useBilStrategy()
  const { evm, sdk, papi } = useRpcProvider()
  const { account } = useAccount()
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const createTransaction = useTransactionsStore((s) => s.createTransaction)
  const { evmAddress, buildBatchCalls } = useVaultEvmCall()
  const address = account?.address ?? ""

  return useMutation({
    mutationFn: async ({
      requestId,
      bilAmount,
    }: {
      requestId: number
      bilAmount: string
    }) => {
      const [, bilAmountBig, bilSettled, , active] = await evm.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getRedemptionRequest",
        args: [BigInt(requestId)],
      })

      if (!active) {
        throw new Error(
          `Redemption request ${requestId} is no longer active (already fulfilled or cancelled)`,
        )
      }

      const returnAmount = bilAmountBig - bilSettled

      const cancelCalls = buildCancelResupplyCalls(
        requestId,
        returnAmount,
        evmAddress,
      )

      const [evmInner, swap, hasDebt] = await Promise.all([
        buildBatchCalls(cancelCalls),
        sdk.api.router.getBestSell(
          Number(bil.id),
          Number(hollar.id),
          returnAmount,
        ),
        sdk.api.aave.hasBorrowPositions(address),
      ])
      const route = TradeRouteBuilder.build(swap.swaps) as Parameters<
        typeof papi.tx.Router.sell
      >[0]["route"]
      const exactSellTx = papi.tx.Router.sell({
        asset_in: Number(bil.id),
        asset_out: Number(hollar.id),
        amount_in: swap.amountIn,
        min_amount_out:
          swap.amountOut - calculateSlippage(swap.amountOut, swapSlippage),
        route,
      })

      const swapTx = hasDebt
        ? papi.tx.Dispatcher.dispatch_with_extra_gas({
            call: exactSellTx.decodedCall,
            extra_gas: AAVE_GAS_LIMIT,
          })
        : exactSellTx

      const batchTx = papi.tx.Utility.batch_all({
        calls: [...evmInner, swapTx.decodedCall],
      })

      return createTransaction({
        tx: batchTx,
        toasts: {
          submitted: t("bil.instantRedeem.toast.submitted", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
          success: t("bil.instantRedeem.toast.success", {
            amount: bilAmount,
            symbol: bil.symbol,
          }),
        },
        invalidateQueries: [[BIL_QUERY_KEY_PREFIX]],
      })
    },
  })
}

/**
 * Claim settled HOLLAR from one or more (already-settled) redemption
 * requests. Goes through `vault.redeem(shares, receiver, controller)`,
 * which walks the controller's settled inventory back-to-front.
 *
 * Pass the number of settled hDCL shares to drain — read from
 * `maxRedeem(controller)` for "claim all", or from
 * `claimableRedeemRequest(requestId, controller)` for a single request.
 */
export function useClaim() {
  const { t } = useTranslation(["strategies", "common"])
  const { bil } = useBilStrategy()
  const { evmAddress, submitTx } = useVaultEvmCall()

  return useMutation({
    mutationFn: (shares: bigint) => {
      const amount = formatUnits(shares, bil.decimals)
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "redeem",
        args: [shares, evmAddress, evmAddress],
      })

      return submitTx(
        VAULT_ADDRESS,
        data,
        [...VAULT_ABI],
        {
          submitted: t("bil.claim.toast.submitted", {
            amount,
            symbol: bil.symbol,
          }),
          success: t("bil.claim.toast.success"),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}

/**
 * Opt the connected wallet in/out of keeper-bot auto-claim. When enabled
 * (and a CLAIM_OPERATOR_ROLE holder is running), the keeper will call
 * `redeem(shares, controller, controller)` on the user's behalf as soon as
 * their requests settle. The role only grants the *timing* of the claim —
 * funds are always paid to the controller's own address.
 */
export function useSetAutoClaim() {
  const { t } = useTranslation(["strategies"])
  const { submitTx } = useVaultEvmCall()
  return useMutation({
    mutationFn: (enabled: boolean) => {
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "setAutoClaim",
        args: [enabled],
      })
      return submitTx(
        VAULT_ADDRESS,
        data,
        [...VAULT_ABI],
        {
          submitted: enabled
            ? t("bil.autoClaim.toast.submitted.enable")
            : t("bil.autoClaim.toast.submitted.disable"),
          success: enabled
            ? t("bil.autoClaim.toast.success.enable")
            : t("bil.autoClaim.toast.success.disable"),
        },
        [[BIL_QUERY_KEY_PREFIX]],
      )
    },
  })
}
