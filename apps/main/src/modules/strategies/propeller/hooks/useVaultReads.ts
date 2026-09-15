import { PRIME_ASSET_ID } from "@galacticcouncil/utils"
import { useQuery } from "@tanstack/react-query"
import { isNullish } from "remeda"
import { erc20Abi, formatUnits, getContract, type Hex } from "viem"

import { useBorrowAssetsApy } from "@/api/borrow"
import {
  POOL_ABI,
  SUBLOOP_ABI,
  VAULT_ABI,
} from "@/modules/strategies/propeller/config/abi"
import { type PropellerVaultConfig } from "@/modules/strategies/propeller/config/vaults"
import {
  HOLLAR_ADDRESS,
  POOL_ADDRESS,
  SUBLOOP_ADDRESS,
} from "@/modules/strategies/propeller/constants"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { usePropellerVaultContract } from "@/modules/strategies/propeller/hooks/usePropellerVaultContract"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

// No on-chain APR view; these are first-paint placeholders until chain reads load.
const FALLBACK_APR = 0
const FALLBACK_MIN_REDEEM = 0

export function useVaultStats() {
  const { data: vault } = usePropellerVaultContract()
  const { getAssetWithFallback } = useAssets()
  const { vaultAddress, assetId } = useActivePropellerVault()
  // CollateralVault has no decimals() override; shares use the collateral scale.
  const decimals = getAssetWithFallback(assetId).decimals
  return useQuery({
    queryKey: ["propeller-vault-stats", vaultAddress, assetId],
    enabled: !!vault,
    queryFn: async () => {
      if (!vault) throw new Error("Vault contract not found")
      const [
        totalAssets,
        totalSupply,
        exchangeRateWad,
        tvlCap,
        paused,
        depositsPaused,
        queueHead,
        queueTail,
      ] = await Promise.all([
        vault.read.totalAssets(),
        vault.read.totalSupply(),
        vault.read.exchangeRate(),
        vault.read.tvlCap(),
        vault.read.paused(),
        vault.read.depositsPaused(),
        vault.read.queueHead(),
        vault.read.queueTail(),
      ])

      const queueLength = queueTail > queueHead ? queueTail - queueHead : 0n

      return {
        totalAssets: Number(formatUnits(totalAssets, decimals)),
        totalSupply: Number(formatUnits(totalSupply, decimals)),
        // exchangeRate is WAD-scaled (1e18), not collateral decimals.
        exchangeRate: Number(formatUnits(exchangeRateWad, 18)),
        queueLength: Number(queueLength),
        tvlCap: Number(formatUnits(tvlCap, decimals)),
        paused,
        depositsPaused,
        minRedeem: FALLBACK_MIN_REDEEM,
        apr: FALLBACK_APR,
      }
    },
    refetchInterval: 30_000,
  })
}

/** SubLoop reads; each call fails independently so a partial deploy does not blank the page. */
export function useSubLoopStats(override?: PropellerVaultConfig) {
  const { evm } = useRpcProvider()
  const { vaultAddress, assetAddress } = useActivePropellerVault(override)
  return useQuery({
    queryKey: ["propeller-subloop-stats", vaultAddress],
    queryFn: async () => {
      const subLoop = getContract({
        address: SUBLOOP_ADDRESS,
        abi: SUBLOOP_ABI,
        client: evm,
      })
      const pool = getContract({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        client: evm,
      })
      const safe = async <T>(
        label: string,
        read: () => Promise<T>,
      ): Promise<T | null> => {
        try {
          return await read()
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(`[propeller-vault] ${label} reverted`, err)
          }
          return null
        }
      }
      const [
        healthFactor,
        negativeCarryBps,
        targetHf,
        account,
        collateralConfig,
        hollarRes,
      ] = await Promise.all([
        safe("SubLoop.healthFactor", () => subLoop.read.healthFactor()),
        safe("SubLoop.negativeCarryBps", () => subLoop.read.negativeCarryBps()),
        safe("SubLoop.targetHf", () => subLoop.read.targetHf()),
        safe("Pool.getUserAccountData(SubLoop)", () =>
          pool.read.getUserAccountData([SUBLOOP_ADDRESS]),
        ),
        safe("Pool.getConfiguration(collateral)", () =>
          pool.read.getConfiguration([assetAddress]),
        ),
        safe("Pool.getReserveData(HOLLAR)", () =>
          pool.read.getReserveData([HOLLAR_ADDRESS]),
        ),
      ])

      // loopLeverage is SubLoop-wide. maxLtv comes from the reserve config bitmap.
      // Do not derive LTV from getUserAccountData(vault): synthetic collateral
      // inflates totalCollateralBase.
      let loopLeverage: number | null = null
      let maxLtv: number | null = null
      let borrowRate: number | null = null
      if (account) {
        const loopColl = account[0]
        const loopDebt = account[1]
        const loopEquity = loopColl - loopDebt // totalCollateralBase − totalDebtBase
        if (loopEquity > 0n)
          loopLeverage = Number(loopColl) / Number(loopEquity)
      }
      if (collateralConfig !== null) {
        const ltvBps = Number(collateralConfig & 0xffffn)
        if (ltvBps > 0) maxLtv = ltvBps / 1e4
      }
      if (hollarRes) {
        borrowRate = Number(hollarRes.currentVariableBorrowRate) / 1e27
      }

      return {
        healthFactor:
          healthFactor === null ? null : Number(formatUnits(healthFactor, 18)),
        targetHf: targetHf === null ? null : Number(formatUnits(targetHf, 18)),
        negativeCarry:
          negativeCarryBps === null ? null : Number(negativeCarryBps) / 1e4,
        leverage: loopLeverage,
        maxLtv,
        borrowRate,
      }
    },
    refetchInterval: 30_000,
  })
}

/**
 * Net deposit APY = maxLtv * loopLeverage * (primeYield - borrowRate).
 * Returns null when inputs are missing or carry is not positive.
 */
export function usePropellerApy(
  override?: PropellerVaultConfig,
): number | null {
  const { data: subLoop } = useSubLoopStats(override)
  const { data: apyData } = useBorrowAssetsApy([PRIME_ASSET_ID])
  const primeSupplyApy = apyData?.find(
    (a) => a.assetId === PRIME_ASSET_ID,
  )?.totalSupplyApy

  const loopLeverage = subLoop?.leverage ?? null
  const maxLtv = subLoop?.maxLtv ?? null
  const borrowRate = subLoop?.borrowRate ?? null
  if (
    isNullish(loopLeverage) ||
    isNullish(maxLtv) ||
    isNullish(borrowRate) ||
    isNullish(primeSupplyApy)
  ) {
    return null
  }
  const primeYield = primeSupplyApy / 100
  const apr = maxLtv * loopLeverage * (primeYield - borrowRate)
  // Percent for common:percent (it divides by 100). Null hides 0/negative APY.
  return apr > 0 ? apr * 100 : null
}

/**
 * SubLoop equity for this vault. equity gates withdraw; pendingUnwind signals
 * a stalled unwind that may pay out short.
 */
export function useLoopPosition() {
  const { evm } = useRpcProvider()
  const { vaultAddress } = useActivePropellerVault()
  return useQuery({
    queryKey: ["propeller-loop-position", vaultAddress],
    queryFn: async () => {
      const subLoop = getContract({
        address: SUBLOOP_ADDRESS,
        abi: SUBLOOP_ABI,
        client: evm,
      })
      const safe = async (label: string, read: () => Promise<bigint>) => {
        try {
          return await read()
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(`[propeller-vault] SubLoop.${label} reverted`, err)
          }
          return null
        }
      }
      const [equity, pendingUnwind] = await Promise.all([
        safe("equityOf", () => subLoop.read.equityOf([vaultAddress])),
        safe("pendingUnwindOf", () =>
          subLoop.read.pendingUnwindOf([vaultAddress]),
        ),
      ])
      return { equity, pendingUnwind }
    },
    refetchInterval: 30_000,
  })
}

export function useUserBalances(evmAddress: Hex | undefined) {
  const { evm } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()
  const { vaultAddress, assetAddress, assetId } = useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals

  return useQuery({
    queryKey: ["propeller-vault-balances", vaultAddress, evmAddress, assetId],
    enabled: !!evmAddress,
    queryFn: async () => {
      if (!evmAddress) return { eth: 0, shares: 0 }

      const ethToken = getContract({
        address: assetAddress,
        abi: erc20Abi,
        client: evm,
      })
      const vault = getContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        client: evm,
      })

      const safeBalance = async (
        label: string,
        read: () => Promise<bigint>,
      ) => {
        try {
          return await read()
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(
              `[propeller-vault] ${label}.balanceOf reverted — treating as 0.`,
              err,
            )
          }
          return 0n
        }
      }

      const [collateralBal, shareBal] = await Promise.all([
        safeBalance("collateral", () => ethToken.read.balanceOf([evmAddress])),
        safeBalance("vault shares", () => vault.read.balanceOf([evmAddress])),
      ] as const)

      return {
        eth: Number(formatUnits(collateralBal, decimals)),
        shares: Number(formatUnits(shareBal, decimals)),
      }
    },
    refetchInterval: 15_000,
  })
}

export function useEthAllowance(evmAddress: Hex | undefined) {
  const { evm } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()
  const { vaultAddress, assetAddress, assetId } = useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals
  return useQuery({
    queryKey: ["propeller-vault-allowance", vaultAddress, evmAddress, assetId],
    enabled: !!evmAddress,
    queryFn: async () => {
      if (!evmAddress) return 0
      const ethToken = getContract({
        address: assetAddress,
        abi: erc20Abi,
        client: evm,
      })
      const allowance = await ethToken.read.allowance([
        evmAddress,
        vaultAddress,
      ])
      return Number(formatUnits(allowance, decimals))
    },
    refetchInterval: 15_000,
  })
}
