import { safeConvertAnyToH160 } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { queryOptions, useQueries } from "@tanstack/react-query"
import { erc20Abi, Hex, PublicClient, zeroAddress } from "viem"

import {
  CLEARING_ABI,
  FACTORY_ABI,
  HYPERVISOR_ABI,
  REBALANCE_PROXY_ABI,
  UNIPROXY_CLEARANCE_ABI,
} from "@/api/gamma/abi"
import { GammaContracts, getGammaContracts } from "@/api/gamma/config"
import { V3PoolBase } from "@/api/pools"
import { useRpcProvider } from "@/providers/rpcProvider"

type HypervisorFn = Extract<
  (typeof HYPERVISOR_ABI)[number],
  { type: "function" }
>["name"]

export type VaultState = {
  address: `0x${string}`
  uniProxy: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  totalSupply: bigint
  total0: bigint
  total1: bigint
  baseLower: number
  baseUpper: number
  limitLower: number
  limitUpper: number
  shareSymbol: string
  /** Deposit whitelist; open when this is the UniProxy. */
  whitelisted: `0x${string}`
  base: { liquidity: bigint; amount0: bigint; amount1: bigint }
  limit: { liquidity: bigint; amount0: bigint; amount1: bigint }
  idle: { amount0: bigint; amount1: bigint }
  deposit0Max: bigint
  deposit1Max: bigint
  supplyCap: bigint
  /** false when a deposit would fail ClearingV2 TWAP checks */
  twapOk: boolean
  lastRebalance: number | null
}

const vaultQuery = (
  evm: PublicClient,
  contracts: GammaContracts,
  pool: V3PoolBase,
) =>
  queryOptions<VaultState | null>({
    queryKey: ["vault", pool.address, contracts.hypervisorFactory],
    queryFn: async () => {
      const factory = contracts.hypervisorFactory

      const { addr0: token0, addr1: token1 } = pool
      if (!token0 || !token1) return null

      const hypervisor = await evm.readContract({
        abi: FACTORY_ABI,
        address: factory,
        functionName: "getHypervisor",
        args: [token0, token1, pool.fee],
      })

      if (hypervisor.toLowerCase() === zeroAddress) return null

      const read = <T>(functionName: HypervisorFn) =>
        evm.readContract({
          abi: HYPERVISOR_ABI,
          address: hypervisor,
          functionName,
        }) as Promise<T>

      const [
        shareSymbol,
        totalSupply,
        totals,
        baseLower,
        baseUpper,
        limitLower,
        limitUpper,
        whitelisted,
        maxTotalSupply,
        deposit0MaxOwn,
        deposit1MaxOwn,
        owner,
        base,
        limit,
        idle0,
        idle1,
        clearing,
      ] = await Promise.all([
        read<string>("symbol"),
        read<bigint>("totalSupply"),
        read<[bigint, bigint]>("getTotalAmounts"),
        read<number>("baseLower"),
        read<number>("baseUpper"),
        read<number>("limitLower"),
        read<number>("limitUpper"),
        read<`0x${string}`>("whitelistedAddress"),
        read<bigint>("maxTotalSupply"),
        read<bigint>("deposit0Max"),
        read<bigint>("deposit1Max"),
        read<`0x${string}`>("owner"),
        read<[bigint, bigint, bigint]>("getBasePosition"),
        read<[bigint, bigint, bigint]>("getLimitPosition"),
        evm.readContract({
          abi: erc20Abi,
          address: token0,
          functionName: "balanceOf",
          args: [hypervisor],
        }),
        evm.readContract({
          abi: erc20Abi,
          address: token1,
          functionName: "balanceOf",
          args: [hypervisor],
        }),
        evm.readContract({
          abi: UNIPROXY_CLEARANCE_ABI,
          address: contracts.uniProxy,
          functionName: "clearance",
        }),
      ])

      const [twapCheck, twapInterval, priceThreshold, position, lastRebalance] =
        await Promise.all([
          evm.readContract({
            abi: CLEARING_ABI,
            address: clearing,
            functionName: "twapCheck",
          }),
          evm.readContract({
            abi: CLEARING_ABI,
            address: clearing,
            functionName: "twapInterval",
          }),
          evm.readContract({
            abi: CLEARING_ABI,
            address: clearing,
            functionName: "priceThreshold",
          }),
          evm.readContract({
            abi: CLEARING_ABI,
            address: clearing,
            functionName: "positions",
            args: [hypervisor],
          }),
          evm
            .readContract({
              abi: REBALANCE_PROXY_ABI,
              address: owner,
              functionName: "lastRebalance",
              args: [hypervisor],
            })
            .catch(() =>
              evm
                .readContract({
                  abi: REBALANCE_PROXY_ABI,
                  address: contracts.rebalanceProxy,
                  functionName: "lastRebalance",
                  args: [hypervisor],
                })
                .catch(() => null),
            ),
        ])

      const {
        3: depositOverride,
        4: twapOverride,
        6: posTwapInterval,
        7: posPriceThreshold,
        8: posDeposit0Max,
        9: posDeposit1Max,
        10: posMaxTotalSupply,
      } = position

      const twapActive = twapCheck || twapOverride
      const twapOk = !twapActive
        ? true
        : await evm
            .readContract({
              abi: CLEARING_ABI,
              address: clearing,
              functionName: "checkPriceChange",
              args: [
                hypervisor,
                twapOverride ? posTwapInterval : twapInterval,
                twapOverride ? posPriceThreshold : priceThreshold,
              ],
            })
            .then(() => true)
            .catch(() => false)

      const supplyCaps = [posMaxTotalSupply, maxTotalSupply].filter(
        (cap) => cap > 0n,
      )

      return {
        address: hypervisor,
        shareSymbol,
        uniProxy: contracts.uniProxy,
        token0,
        token1,
        totalSupply,
        total0: totals[0],
        total1: totals[1],
        baseLower,
        baseUpper,
        limitLower,
        limitUpper,
        whitelisted,
        base: { liquidity: base[0], amount0: base[1], amount1: base[2] },
        limit: { liquidity: limit[0], amount0: limit[1], amount1: limit[2] },
        idle: { amount0: idle0, amount1: idle1 },
        deposit0Max: depositOverride ? posDeposit0Max : deposit0MaxOwn,
        deposit1Max: depositOverride ? posDeposit1Max : deposit1MaxOwn,
        supplyCap: supplyCaps.length
          ? supplyCaps.reduce((min, cap) => (cap < min ? cap : min))
          : 0n,
        twapOk,
        lastRebalance:
          lastRebalance && lastRebalance > 0n ? Number(lastRebalance) : null,
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const useVaultStates = (pools: V3PoolBase[]) => {
  const { evm, endpoint } = useRpcProvider()
  const contracts = getGammaContracts(endpoint)

  return useQueries({
    queries: pools.map((pool) => vaultQuery(evm, contracts, pool)),
    combine: (results) => ({
      data: results.map((result) => result.data ?? null),
      isLoading: results.some((result) => result.isLoading),
    }),
  })
}

export const useVaultShares = (vaults: (VaultState | null)[]) => {
  const { evm } = useRpcProvider()
  const { account } = useAccount()

  const owner = account?.address
    ? (safeConvertAnyToH160(account.address) as Hex | null)
    : null

  return useQueries({
    queries: vaults.map((vault) =>
      queryOptions<bigint>({
        queryKey: ["vaultShares", vault?.address, owner],
        enabled: !!vault && !!owner,
        queryFn: async () => {
          if (!vault || !owner) return 0n

          return evm.readContract({
            abi: HYPERVISOR_ABI,
            address: vault.address,
            functionName: "balanceOf",
            args: [owner],
          })
        },
        staleTime: 30_000,
      }),
    ),
    combine: (results) => ({
      data: results.map((result) => result.data ?? 0n),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      isDisconnected: !owner,
    }),
  })
}
