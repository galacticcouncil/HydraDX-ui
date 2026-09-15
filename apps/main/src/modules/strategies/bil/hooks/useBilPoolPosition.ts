import { EVM_DECIMALS } from "@galacticcouncil/web3-connect/src/config/evm"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { type Address, formatUnits, getContract, maxUint256 } from "viem"

import {
  ERC20_ABI,
  GHO_FACILITATOR_ABI,
} from "@/modules/strategies/bil/config/abi"
import {
  DCL_PRECOMPILE_ADDRESS,
  HOLLAR_ADDRESS,
} from "@/modules/strategies/bil/config/constants"
import {
  bilPoolContractQuery,
  useBilPoolContract,
} from "@/modules/strategies/bil/hooks/useBilPoolContract"
import { bilQueryKeys } from "@/modules/strategies/bil/utils/queryKeys"
import { useRpcProvider } from "@/providers/rpcProvider"

export interface BilPoolPosition {
  totalCollateralUsd: number
  totalDebtUsd: number
  availableBorrowsUsd: number
  ltvPct: number
  liquidationThresholdPct: number
  healthFactor: number
  hasCollateral: boolean
}

/**
 * Reads the user's account state on the BIL Aave pool.
 *
 * Drives `AvailableToBorrowCard` + the health-factor display in the Borrow
 * modal. Single contract round-trip via `pool.getUserAccountData` — Aave
 * does the per-reserve aggregation server-side so we don't have to.
 *
 * Note: this lives in its own hook rather than the existing `useVaultReads`
 * because the BIL pool is a *separate* Aave instance from the main money
 * market — different addresses, different lifetime. The data isn't useful
 * outside the BIL strategy page.
 */
export function useBilPoolPosition(evmAddress: string | undefined) {
  const { data: pool } = useBilPoolContract()
  return useQuery({
    queryKey: bilQueryKeys.poolPosition(evmAddress),
    enabled: !!evmAddress && !!pool,
    queryFn: async (): Promise<BilPoolPosition> => {
      if (!evmAddress || !pool) {
        return {
          totalCollateralUsd: 0,
          totalDebtUsd: 0,
          availableBorrowsUsd: 0,
          ltvPct: 0,
          liquidationThresholdPct: 0,
          healthFactor: Infinity,
          hasCollateral: false,
        }
      }

      const [
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactor,
      ] = await pool.read.getUserAccountData([evmAddress as Address])

      return {
        totalCollateralUsd: Number(formatUnits(totalCollateralBase, 8)),
        totalDebtUsd: Number(formatUnits(totalDebtBase, 8)),
        availableBorrowsUsd: Number(formatUnits(availableBorrowsBase, 8)),
        ltvPct: Number(ltv) / 100,
        liquidationThresholdPct: Number(currentLiquidationThreshold) / 100,
        healthFactor:
          healthFactor === maxUint256
            ? Infinity
            : Number(formatUnits(healthFactor, EVM_DECIMALS)),
        hasCollateral: totalCollateralBase > 0n,
      }
    },
  })
}

export interface BilReserveConfig {
  maxLtvPct: number
  liquidationThresholdPct: number
  borrowAprPct: number
  borrowApyPct: number
  borrowingEnabled: boolean
  borrowCapHollar: number
  totalDebtHollar: number
  remainingBorrowCapHollar: number
}

const BORROW_CAP_MAXED_PERCENT = 99.99
const MAX_BORROW_SAFETY_MARGIN = 0.99

function getEffectiveRemainingBorrowCap(
  reserveConfig: BilReserveConfig,
): number {
  const { borrowCapHollar, totalDebtHollar, remainingBorrowCapHollar } =
    reserveConfig
  if (borrowCapHollar <= 0) return remainingBorrowCapHollar

  const borrowCapUsage = (totalDebtHollar / borrowCapHollar) * 100
  if (borrowCapUsage >= BORROW_CAP_MAXED_PERCENT) return 0

  return remainingBorrowCapHollar
}

export function getBilMaxBorrowable(
  availableBorrowsUsd: number,
  reserveConfig: BilReserveConfig | undefined,
  totalDebtUsd = 0,
): number {
  if (availableBorrowsUsd <= 0) return 0

  const effectiveRemainingCap = reserveConfig
    ? getEffectiveRemainingBorrowCap(reserveConfig)
    : Number.POSITIVE_INFINITY

  if (effectiveRemainingCap <= 0) return 0

  const maxBorrowable = Math.min(availableBorrowsUsd, effectiveRemainingCap)

  const shouldAddMargin =
    totalDebtUsd > 0 ||
    maxBorrowable >= availableBorrowsUsd ||
    (!!reserveConfig &&
      reserveConfig.borrowCapHollar > 0 &&
      reserveConfig.totalDebtHollar > 0 &&
      maxBorrowable >= effectiveRemainingCap)

  const amountWithMargin = shouldAddMargin
    ? maxBorrowable * MAX_BORROW_SAFETY_MARGIN
    : maxBorrowable

  return Math.max(0, amountWithMargin)
}

export function useBilMaxBorrowable(evmAddress: string | undefined) {
  const { data: poolPosition, isLoading: isPoolPositionLoading } =
    useBilPoolPosition(evmAddress)
  const { data: reserveConfig, isLoading: isReserveConfigLoading } =
    useBilReserveConfig()

  const isLoading = isPoolPositionLoading || isReserveConfigLoading

  const maxBorrowableUsd = isLoading
    ? 0
    : getBilMaxBorrowable(
        poolPosition?.availableBorrowsUsd ?? 0,
        reserveConfig,
        poolPosition?.totalDebtUsd ?? 0,
      )

  return {
    maxBorrowableUsd,
    isLoading,
    poolPosition,
    reserveConfig,
  }
}

/**
 * Static reserve configuration for BIL on the BIL Aave pool. Drives the
 * Strategy overview's Max LTV / Liquidation LTV display, replacing the
 * static placeholders in `STRATEGY` (which can drift if governance changes
 * the on-chain values).
 *
 * Aave V3 packs the configuration into a single uint256 — bits 0-15 hold
 * the LTV in basis points and bits 16-31 hold the liquidation threshold,
 * also in basis points. We mask + shift to extract, then divide by 100 to
 * convert bps → percentage.
 */
export function useBilReserveConfig() {
  const rpc = useRpcProvider()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: bilQueryKeys.reserveConfig(),
    enabled: rpc.isReady,
    queryFn: async (): Promise<BilReserveConfig> => {
      const pool = await queryClient.ensureQueryData(bilPoolContractQuery(rpc))
      // The DCL precompile (asset 550) is the actual reserve; BIL (asset 55,
      // the aToken receipt) is a user-facing alias and is *not* registered as
      // a reserve, so getConfiguration on it returns 0x.
      const [config, reserveData] = await Promise.all([
        pool.read.getConfiguration([DCL_PRECOMPILE_ADDRESS]),
        pool.read.getReserveData([HOLLAR_ADDRESS]),
      ])
      const data = config.data
      const ltvBps = Number(data & 0xffffn)
      const liqThresholdBps = Number((data >> 16n) & 0xffffn)

      // currentVariableBorrowRate is stored as a uint128 ray (1e27) — the
      // annual *linear* rate. Convert to APY via Aave's per-second compounding:
      //   apy = (1 + apr/n)^n − 1,  n = 31_536_000 (seconds per year).
      const RAY = 1e27
      const SECONDS_PER_YEAR = 31_536_000
      const borrowApr = Number(reserveData.currentVariableBorrowRate) / RAY
      const borrowApy =
        Math.pow(1 + borrowApr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1
      // HOLLAR borrowing is disabled at launch (staged rollout); bit 58 of the
      // HOLLAR reserve's config is the BORROWING_ENABLED flag. Leverage — and
      // therefore the leveraged "Max Net APY" — is only real once it's on.
      const borrowingEnabled = ((reserveData.configuration >> 58n) & 1n) === 1n

      const [bucketCapacity, bucketLevel] = await rpc.evm.readContract({
        address: HOLLAR_ADDRESS,
        abi: GHO_FACILITATOR_ABI,
        functionName: "getFacilitatorBucket",
        args: [reserveData.aTokenAddress],
      })

      const facilitatorRemainingHollar =
        bucketCapacity > 0n
          ? Number(
              formatUnits(
                bucketCapacity > bucketLevel
                  ? bucketCapacity - bucketLevel
                  : 0n,
                EVM_DECIMALS,
              ),
            )
          : Number.POSITIVE_INFINITY

      const borrowCapHollar =
        bucketCapacity > 0n
          ? Number(formatUnits(bucketCapacity, EVM_DECIMALS))
          : 0

      // Aave V3 reserve borrow cap (bits 80-115) — fallback for non-GHO assets.
      const hollarConfig = reserveData.configuration
      const reserveBorrowCapHollar = Number(
        (hollarConfig >> 80n) & 0xfffffffffn,
      )

      const variableDebtToken = getContract({
        address: reserveData.variableDebtTokenAddress,
        abi: ERC20_ABI,
        client: rpc.evm,
      })
      const totalVariableDebt = await variableDebtToken.read.totalSupply()
      const totalDebtHollar = Number(
        formatUnits(totalVariableDebt, EVM_DECIMALS),
      )

      const reserveCapRemainingHollar =
        reserveBorrowCapHollar > 0
          ? Math.max(0, reserveBorrowCapHollar - totalDebtHollar)
          : Number.POSITIVE_INFINITY

      const remainingBorrowCapHollar = Math.min(
        facilitatorRemainingHollar,
        reserveCapRemainingHollar,
      )

      const effectiveBorrowCapHollar =
        borrowCapHollar > 0 ? borrowCapHollar : reserveBorrowCapHollar

      return {
        maxLtvPct: ltvBps / 100,
        liquidationThresholdPct: liqThresholdBps / 100,
        borrowAprPct: borrowApr * 100,
        borrowApyPct: borrowApy * 100,
        borrowingEnabled,
        borrowCapHollar: effectiveBorrowCapHollar,
        totalDebtHollar,
        remainingBorrowCapHollar,
      }
    },
  })
}
