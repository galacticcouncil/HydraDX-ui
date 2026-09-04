import {
  formatSourceChainAddress,
  HYDRATION_CHAIN_KEY,
  useStableArray,
} from "@galacticcouncil/utils"
import { AssetAmount } from "@galacticcouncil/xc-core"
import {
  useQueries,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query"
import Big from "big.js"
import { useCallback, useMemo } from "react"
import { isNonNullish, unique } from "remeda"

import {
  fetchHydrationRegistryAssetAmounts,
  useAccountBalanceFilter,
} from "@/api/balances"
import { useKrakenSpotPrice } from "@/api/external/kraken"
import { portfolioBalanceQueryKey } from "@/api/portfolio/queryKeys"
import {
  useCrossChainConfigService,
  useCrossChainWallet,
  useHydrationAssetId,
} from "@/api/xcm"
import { PORTFOLIO_CACHE_MAX_AGE, PORTFOLIO_CHAINS } from "@/config/portfolio"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useAssetsPrice } from "@/states/displayAsset"
import { toDecimal } from "@/utils/formatting"

export type MultichainValuedBalance = {
  balance: AssetAmount
  assetId: string | null
  displayValue: string | null
}

type MultichainBalanceEntry = {
  address: string
  chainKey: string
  balances: AssetAmount[]
  isLoading: boolean
  isError: boolean
}

export const useMultichainPortfolio = (
  addresses: string[],
  chains: string[] = PORTFOLIO_CHAINS,
) => {
  const wallet = useCrossChainWallet()
  const configService = useCrossChainConfigService()
  const queryClient = useQueryClient()
  const { sdk, isReady } = useRpcProvider()
  const { getAsset, isToken, isErc20 } = useAssets()
  const balanceFilter = useAccountBalanceFilter()
  const stableAddresses = useStableArray(addresses)
  const stableChains = useStableArray(chains)

  const fetchHydrationBalances = useCallback(
    (address: string) => {
      if (!balanceFilter) {
        throw new Error("[multichain] account balance filter is not ready")
      }

      const hydrationChain = configService.chains.get(HYDRATION_CHAIN_KEY)
      const formatted = hydrationChain
        ? formatSourceChainAddress(address, hydrationChain)
        : address

      return fetchHydrationRegistryAssetAmounts({
        address: formatted,
        sdk,
        filter: balanceFilter,
        getAsset,
        isToken,
        isErc20,
      })
    },
    [sdk, balanceFilter, getAsset, isToken, isErc20, configService],
  )

  const pairs = useMemo(
    () =>
      stableAddresses.flatMap((address) =>
        wallet
          .getChainsForAddress(address, stableChains)
          .map((chain) => ({ address, chainKey: chain.key })),
      ),
    [wallet, stableAddresses, stableChains],
  )

  const queries = useMemo(
    () =>
      pairs.map(({ address, chainKey }) => ({
        queryKey: portfolioBalanceQueryKey(address, chainKey),
        queryFn: () => {
          if (chainKey === HYDRATION_CHAIN_KEY) {
            return fetchHydrationBalances(address)
          }

          const chain = configService.chains.get(chainKey)
          if (!chain) throw new Error(`Chain ${chainKey} is not configured`)

          return wallet.getBalances(
            formatSourceChainAddress(address, chain),
            chain,
          )
        },
        enabled:
          chainKey !== HYDRATION_CHAIN_KEY ||
          (isReady && !!Object.keys(sdk).length && !!balanceFilter),
        staleTime: 60_000,
        gcTime: PORTFOLIO_CACHE_MAX_AGE,
        refetchOnWindowFocus: false,
      })),
    [
      pairs,
      fetchHydrationBalances,
      wallet,
      configService,
      isReady,
      sdk,
      balanceFilter,
    ],
  )

  const combine = useCallback(
    (results: ReadonlyArray<UseQueryResult<AssetAmount[]>>) => ({
      entries: pairs.map<MultichainBalanceEntry>((pair, i) => ({
        ...pair,
        balances: results[i]?.data ?? [],
        isLoading: results[i]?.isLoading ?? true,
        isError: results[i]?.isError ?? false,
      })),
      isLoading: results.some((query) => query.isLoading),
      isRefetching: results.some((query) => query.isRefetching),
      lastUpdatedAt: Math.max(
        0,
        ...results.map((query) => query.dataUpdatedAt),
      ),
    }),
    [pairs],
  )

  const { entries, isLoading, isRefetching, lastUpdatedAt } = useQueries({
    queries,
    combine,
  })

  const getHydrationAssetId = useHydrationAssetId()

  const resolvePortfolioAssetId = useCallback(
    (balance: AssetAmount, chainKey: string): string | null =>
      chainKey === HYDRATION_CHAIN_KEY && /^\d+$/.test(balance.key)
        ? balance.key
        : getHydrationAssetId(balance, chainKey),
    [getHydrationAssetId],
  )

  // resolving an asset id walks xcm routes, so keep it off the price path
  const resolved = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        balances: entry.balances.map((balance) => ({
          balance,
          assetId: resolvePortfolioAssetId(balance, entry.chainKey),
        })),
      })),
    [entries, resolvePortfolioAssetId],
  )

  const assetIds = useMemo(
    () =>
      unique(
        resolved.flatMap((entry) =>
          entry.balances.map(({ assetId }) => assetId).filter(isNonNullish),
        ),
      ),
    [resolved],
  )

  const { getAssetPrice } = useAssetsPrice(assetIds)
  const { data: nearSpotPrice } = useKrakenSpotPrice(
    stableChains.includes("near") ? "near" : undefined,
  )

  const refetchPair = useCallback(
    (address: string, chainKey: string) =>
      void queryClient.refetchQueries({
        queryKey: portfolioBalanceQueryKey(address, chainKey),
      }),
    [queryClient],
  )

  const refetchChain = useCallback(
    (chainKey: string) =>
      pairs
        .filter((pair) => pair.chainKey === chainKey)
        .forEach(({ address }) => refetchPair(address, chainKey)),
    [pairs, refetchPair],
  )

  const refetchAll = useCallback(
    () =>
      pairs.forEach(({ address, chainKey }) => refetchPair(address, chainKey)),
    [pairs, refetchPair],
  )

  const byChain = useMemo(
    () =>
      stableChains.flatMap((chainKey) => {
        const chainEntries = resolved.filter(
          (entry) => entry.chainKey === chainKey,
        )
        const chain = configService.chains.get(chainKey)
        if (!chainEntries.length || !chain) return []

        const balances = chainEntries.flatMap((entry) =>
          entry.balances.map(({ balance, assetId }) => {
            const registryPrice = assetId ? getAssetPrice(assetId) : null
            const spotPrice = registryPrice?.isValid
              ? registryPrice.price
              : chainKey === "near" && nearSpotPrice !== undefined
                ? nearSpotPrice.toString()
                : null

            return {
              balance,
              assetId,
              displayValue: spotPrice
                ? Big(spotPrice)
                    .times(toDecimal(balance.amount, balance.decimals))
                    .toString()
                : null,
            }
          }),
        )
        const isLoading = chainEntries.some((entry) => entry.isLoading)
        const isError = chainEntries.some((entry) => entry.isError)
        const hasAssets = balances.some(({ balance }) =>
          Big(balance.amount.toString()).gt(0),
        )

        const isOnlyChainForAnyAddress = stableAddresses.some((address) => {
          const chainsForAddress = wallet.getChainsForAddress(
            address,
            stableChains,
          )
          return (
            chainsForAddress.length === 1 &&
            chainsForAddress[0]?.key === chainKey
          )
        })

        // hide chains with nothing to show; keep errors visible for retry
        // keep a wallet's sole native chain visible so single-chain wallets
        // (Solana, Sui, …) don't collapse to an empty portfolio shell
        if (!isError && !isLoading && !hasAssets && !isOnlyChainForAnyAddress) {
          return []
        }

        return [
          {
            chainKey,
            chain,
            balances,
            total: balances
              .reduce(
                (acc, { displayValue }) => acc.plus(displayValue ?? "0"),
                Big(0),
              )
              .toString(),
            isLoading,
            isError,
            refetch: () => refetchChain(chainKey),
          },
        ]
      }),
    [
      configService.chains,
      getAssetPrice,
      nearSpotPrice,
      refetchChain,
      resolved,
      stableAddresses,
      stableChains,
      wallet,
    ],
  )

  return { byChain, isLoading, isRefetching, lastUpdatedAt, refetchAll }
}
