import { pool, SdkCtx } from "@galacticcouncil/sdk-next"
import { aave } from "@galacticcouncil/sdk-next/pool"
import {
  type QueryClient,
  queryOptions,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { erc20Abi, PublicClient } from "viem"

import { POOL_ABI } from "@/api/gamma/abi"
import { getGammaContracts } from "@/api/gamma/config"
import { loadBootstrapV3Pools } from "@/api/gamma/v3Bootstrap"
import { useRpcProvider } from "@/providers/rpcProvider"
import { HUB_ID } from "@/utils/consts"

export type OmniPoolToken = pool.omni.OmniPoolToken
export type StableSwapBase = pool.stable.StableSwapBase
export type PoolBase = Omit<pool.PoolBase, "tokens"> & {
  tokens: [PoolToken, PoolToken]
}
export type PoolToken = pool.PoolToken
export type PoolFee = pool.PoolFee
export type V3Tick = pool.uniswapv3.V3Tick
// SDK V3 pool with optional ticks (EVM bootstrap reads omit them).
export type V3PoolBase = Omit<
  pool.uniswapv3.UniswapV3PoolBase,
  "tokens" | "ticks"
> & {
  tokens: [PoolToken, PoolToken]
  ticks?: V3Tick[]
}

export const PoolType = pool.PoolType

export type PoolTypeValue = pool.PoolType

export const allPools = (sdk: SdkCtx) =>
  queryOptions({
    queryKey: ["allPools"],
    queryFn: async () => {
      const pools = await sdk.api.router.getPools()

      const stablePools: StableSwapBase[] = []
      const xykPools: PoolBase[] = []
      const omnipoolTokens: OmniPoolToken[] = []
      const aavePools: aave.AavePool[] = []
      const v3Pools: V3PoolBase[] = []
      let hub: PoolToken | undefined

      for (const pool of pools) {
        if (pool.type === PoolType.Stable) {
          stablePools.push(pool as StableSwapBase)
        } else if (
          pool.type === PoolType.XYK &&
          pool.tokens.every((token) => !!token.decimals)
        ) {
          const [tokenA, tokenB] = pool.tokens
          if (!tokenA || !tokenB) continue

          xykPools.push({
            ...pool,
            tokens: [tokenA, tokenB],
          })
        } else if (pool.type === PoolType.Omni) {
          const tokens = pool.tokens as OmniPoolToken[]

          for (const token of tokens) {
            if (token.id === Number(HUB_ID)) {
              hub = token
            } else {
              omnipoolTokens.push(token)
            }
          }
        } else if (pool.type === PoolType.Aave) {
          aavePools.push(pool as aave.AavePool)
        } else if (pool.type === PoolType.V3) {
          const [tokenA, tokenB] = pool.tokens
          if (!tokenA || !tokenB) continue

          v3Pools.push({
            ...pool,
            tokens: [tokenA, tokenB],
          } as V3PoolBase)
        }
      }

      return {
        omnipoolTokens,
        stablePools,
        hub: hub,
        xykPools,
        aavePools,
        v3Pools,
        allPools: pools,
      }
    },
  })

export const stablePoolsQuery = (sdk: SdkCtx, queryClient: QueryClient) =>
  queryOptions<StableSwapBase[]>({
    queryKey: ["pools", "stable"],
    queryFn: async () => {
      const { stablePools } = await queryClient.ensureQueryData(allPools(sdk))

      return stablePools
    },
    staleTime: Infinity,
  })

export const hubTokenQuery = (sdk: SdkCtx, queryClient: QueryClient) =>
  queryOptions<PoolToken | undefined>({
    queryKey: ["pool", "hub"],
    queryFn: async () => {
      const { hub } = await queryClient.ensureQueryData(allPools(sdk))

      return hub
    },
    staleTime: Infinity,
  })

export const omnipoolTokensQuery = (sdk: SdkCtx, queryClient: QueryClient) =>
  queryOptions<OmniPoolToken[]>({
    queryKey: ["pools", "omnipool"],
    queryFn: async () => {
      const { omnipoolTokens } = await queryClient.ensureQueryData(
        allPools(sdk),
      )

      return omnipoolTokens
    },
    staleTime: Infinity,
  })

const v3PoolsQuery = (
  sdk: SdkCtx,
  queryClient: QueryClient,
  evm: PublicClient,
  endpoint: string,
) =>
  queryOptions<V3PoolBase[]>({
    queryKey: ["pools", "v3", endpoint],
    queryFn: async () => {
      const { v3Pools } = await queryClient.fetchQuery(allPools(sdk))

      const known = new Set(v3Pools.map((pool) => pool.address.toLowerCase()))
      const bootstrap = await loadBootstrapV3Pools(
        evm,
        sdk,
        getGammaContracts(endpoint),
      )
      const extra = bootstrap.filter(
        (pool) => !known.has(pool.address.toLowerCase()),
      )

      return [...v3Pools, ...extra]
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

/**
 * The share of every swap fee that stays with the pool's liquidity providers.
 *
 * Uniswap v3 packs both sides' protocol-fee switches into slot0's `feeProtocol`:
 * the low nibble is token0, the high nibble token1, and a value of `n` means
 * 1/n of that side's fee is taken by the protocol (0 = off). A two-sided flow
 * pays both, so the LP share is one minus the mean of the two.
 */
export const v3LpFeeShare = (feeProtocol: number) => {
  const cut = (n: number) => (n > 0 ? 1 / n : 0)

  return 1 - (cut(feeProtocol % 16) + cut(Math.floor(feeProtocol / 16))) / 2
}

export type V3PoolMetrics = {
  /** Tokens the pool contract actually holds, raw units. */
  reserve0: bigint
  reserve1: bigint
  lpFeeShare: number
}

/**
 * What a v3 pool holds and how it splits its fees, read from the contracts.
 *
 * The pool's own `tokens[].balance` are VIRTUAL reserves — the constant-product
 * depth the active liquidity offers at the current price — so they overstate a
 * concentrated pool's deposits by its concentration factor and cannot stand in
 * for TVL. `balanceOf` is the deposited value.
 */
const v3PoolMetricsQuery = (evm: PublicClient, pool: V3PoolBase) =>
  queryOptions<V3PoolMetrics>({
    queryKey: ["pools", "v3", "metrics", pool.address],
    queryFn: async () => {
      const address = pool.address as `0x${string}`

      const balanceOf = (token: `0x${string}`) =>
        evm.readContract({
          abi: erc20Abi,
          address: token,
          functionName: "balanceOf",
          args: [address],
        })

      const [slot0, reserve0, reserve1] = await Promise.all([
        evm.readContract({ abi: POOL_ABI, address, functionName: "slot0" }),
        balanceOf(pool.addr0),
        balanceOf(pool.addr1),
      ])

      return { reserve0, reserve1, lpFeeShare: v3LpFeeShare(Number(slot0[5])) }
    },
    staleTime: 30_000,
  })

/** Per-pool live state, in the order the pools were given. */
export const useV3PoolMetrics = (pools: V3PoolBase[]) => {
  const { evm } = useRpcProvider()

  return useQueries({
    queries: pools.map((pool) => v3PoolMetricsQuery(evm, pool)),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
    }),
  })
}

export const useV3Pools = () => {
  const queryClient = useQueryClient()
  const { sdk, evm, endpoint } = useRpcProvider()

  return useQuery(v3PoolsQuery(sdk, queryClient, evm, endpoint))
}

export const xykPoolQuery = (
  sdk: SdkCtx,
  queryClient: QueryClient,
  address: string,
) =>
  queryOptions({
    queryKey: ["pool", "xyk", address],
    queryFn: async () => {
      const { xykPools } = await queryClient.ensureQueryData(allPools(sdk))

      return xykPools.find((pool) => pool.address === address)
    },
  })

const xykPoolsQuery = (sdk: SdkCtx, queryClient: QueryClient) =>
  queryOptions<PoolBase[]>({
    queryKey: ["pools", "xyk"],
    queryFn: async () => {
      const { xykPools } = await queryClient.ensureQueryData(allPools(sdk))

      return xykPools
    },
    staleTime: Infinity,
  })

export const useXykPools = () => {
  const queryClient = useQueryClient()
  const { sdk } = useRpcProvider()

  return useQuery(xykPoolsQuery(sdk, queryClient))
}

export const useXykPool = (address: string) => {
  const queryClient = useQueryClient()
  const { sdk } = useRpcProvider()

  return useQuery(xykPoolQuery(sdk, queryClient, address))
}

export const useStablePools = () => {
  const queryClient = useQueryClient()
  const { sdk } = useRpcProvider()

  return useQuery(stablePoolsQuery(sdk, queryClient))
}

export const useOmnipoolIds = () => {
  const { isReady, sdk } = useRpcProvider()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ["omnipoolIds"],
    queryFn: async () => {
      const omnipoolTokens = await queryClient.ensureQueryData(
        omnipoolTokensQuery(sdk, queryClient),
      )

      return omnipoolTokens.map((token) => token.id.toString())
    },
    staleTime: Infinity,
    enabled: isReady,
    notifyOnChangeProps: [],
  })
}
