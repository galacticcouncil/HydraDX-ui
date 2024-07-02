import { u32 } from "@polkadot/types-codec"
import { useQuery } from "@tanstack/react-query"
import { useSpotPrice, useSpotPrices } from "api/spotPrice"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { STABLECOIN_SYMBOL } from "./constants"
import { QUERY_KEYS } from "./queryKeys"
import { useAccountsBalances } from "api/accountBalances"
import { useRpcProvider } from "providers/rpcProvider"
import { useShareTokensByIds } from "api/xyk"
import { isNotNil } from "./helpers"
import { useShareOfPools } from "api/pools"

type Props = { id: string; amount: BigNumber }

export const useDisplayValue = (props: Props) => {
  const displayAsset = useDisplayAssetStore()
  const spotPrice = useSpotPrice(props.id, displayAsset.id)

  const isLoading = spotPrice.isInitialLoading

  const symbol = displayAsset.symbol
  const amount = useMemo(() => {
    if (!displayAsset.id || !spotPrice.data || spotPrice.data.spotPrice.isNaN())
      return undefined

    return props.amount.times(spotPrice.data.spotPrice)
  }, [props.amount, displayAsset, spotPrice.data])

  return { amount, symbol, isLoading }
}

export const useDisplayPrice = (id: string | u32 | undefined) => {
  const displayAsset = useDisplayAssetStore()
  const spotPrice = useSpotPrice(id, displayAsset.id)
  const usdPrice = useCoingeckoUsdPrice()

  const isLoading = spotPrice.isInitialLoading || usdPrice.isInitialLoading

  const data = useMemo(() => {
    if (isLoading) return undefined

    if (displayAsset.isRealUSD && usdPrice.data)
      return spotPrice.data
        ? {
            ...spotPrice.data,
            spotPrice: spotPrice.data.spotPrice.times(usdPrice.data),
          }
        : undefined

    return spotPrice.data
  }, [displayAsset.isRealUSD, isLoading, spotPrice.data, usdPrice.data])

  return { data, isLoading, isInitialLoading: isLoading }
}

//TODO: mb create a hook for a single share token
export const useDisplayShareTokenPrice = (ids: string[]) => {
  const { assets } = useRpcProvider()

  const pools = useShareTokensByIds(ids)

  const poolsAddress = pools.data?.map((pool) => pool.poolAddress) ?? []

  const poolBalances = useAccountsBalances(Array.from(poolsAddress.values()))
  const totalIssuances = useShareOfPools(ids)

  const shareTokensTvl = useMemo(() => {
    return !pools.data
      ? []
      : pools.data
          .map((shareToken) => {
            const { poolAddress } = shareToken
            const poolBalance = poolBalances.data?.find(
              (poolBalance) => poolBalance.accountId === poolAddress,
            )

            const assetA = poolBalance?.balances.find((balance) =>
              shareToken.assets.some((asset) => asset.id === balance.id),
            )

            if (!assetA) return undefined

            const assetABalance = assetA.freeBalance.shiftedBy(
              -assets.getAsset(assetA.id.toString()).decimals,
            )

            const tvl = assetABalance.multipliedBy(2)

            return {
              spotPriceId: assetA.id.toString(),
              tvl,
              shareTokenId: shareToken.shareTokenId,
            }
          })
          .filter(isNotNil)
  }, [pools.data, poolBalances.data, assets])

  const spotPrices = useDisplayPrices(
    shareTokensTvl.map((shareTokenTvl) => shareTokenTvl.spotPriceId),
  )

  const queries = [totalIssuances, pools, poolBalances, spotPrices]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    return shareTokensTvl
      .map((shareTokenTvl) => {
        const spotPrice = spotPrices.data?.find(
          (spotPrice) => spotPrice?.tokenIn === shareTokenTvl.spotPriceId,
        )

        const tvlDisplay = shareTokenTvl.tvl.multipliedBy(
          spotPrice?.spotPrice ?? 1,
        )

        const totalIssuance = totalIssuances.data?.find(
          (totalIssuance) => totalIssuance.asset === shareTokenTvl.shareTokenId,
        )

        const shareTokenMeta = assets.getAsset(shareTokenTvl.shareTokenId)

        if (!totalIssuance?.totalShare || !spotPrice?.tokenOut) return undefined

        const shareTokenDisplay = tvlDisplay.div(
          totalIssuance.totalShare.shiftedBy(-shareTokenMeta.decimals),
        )

        return {
          tokenIn: shareTokenTvl.shareTokenId,
          tokenOut: spotPrice.tokenOut,
          spotPrice: shareTokenDisplay,
        }
      })
      .filter(isNotNil)
  }, [assets, shareTokensTvl, spotPrices.data, totalIssuances.data])

  return { data, isLoading, isInitialLoading: isLoading }
}

export const useDisplayPrices = (
  ids: (string | u32)[],
  noRefresh?: boolean,
) => {
  const displayAsset = useDisplayAssetStore()
  const spotPrices = useSpotPrices(ids, displayAsset.id, noRefresh)
  const usdPrice = useCoingeckoUsdPrice()

  const isLoading =
    spotPrices.some((q) => q.isInitialLoading) || usdPrice.isInitialLoading

  const data = useMemo(() => {
    if (isLoading) return undefined

    if (displayAsset.isRealUSD && usdPrice.data)
      return spotPrices.map((sp) =>
        sp.data
          ? { ...sp.data, spotPrice: sp.data.spotPrice.times(usdPrice.data) }
          : undefined,
      )

    return spotPrices.map((sp) => sp.data)
  }, [displayAsset.isRealUSD, isLoading, spotPrices, usdPrice.data])

  return { data, isLoading, isInitialLoading: isLoading }
}

type Asset = {
  id: string | undefined
  symbol: string
  isRealUSD: boolean
  isStableCoin: boolean
  isDollar?: boolean
  stableCoinId: string | undefined
}
export type DisplayAssetStore = Asset & {
  update: (asset: Asset) => void
}

export const useDisplayAssetStore = create<DisplayAssetStore>()(
  persist(
    (set) => ({
      id: undefined,
      stableCoinId: undefined,
      symbol: "$",
      isDollar: true,
      isRealUSD: false,
      isStableCoin: true,
      update: (value) =>
        set({ ...value, isDollar: value.isRealUSD || value.isStableCoin }),
    }),
    { name: "hdx-display-asset", version: 1 },
  ),
)

export const useCoingeckoUsdPrice = () => {
  const displayAsset = useDisplayAssetStore()

  return useQuery(QUERY_KEYS.coingeckoUsd, getCoingeckoSpotPrice, {
    enabled: displayAsset.isRealUSD,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: 1000 * 60 * 60 * 24, // 24h
  })
}

export const getCoingeckoSpotPrice = async () => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${STABLECOIN_SYMBOL.toLowerCase()}&vs_currencies=usd`,
  )
  const json = await res.json()
  return json[STABLECOIN_SYMBOL.toLowerCase()].usd
}

type simplifiedAsset = {
  id: string | u32
  name: string
  symbol: string
}

export const useAssetPrices = (
  assets: simplifiedAsset[],
  noRefresh?: boolean,
) => {
  const displayAsset = useDisplayAssetStore()
  const ids = assets.map((asset) => asset.id)
  const spotPrices = useSpotPrices(ids, displayAsset.id, noRefresh)
  const coingeckoAssetNames = spotPrices
    .filter((asset) => asset?.data?.spotPrice.isNaN())
    .map((asset) => {
      const matchingAsset = assets.find((a) => a.id === asset?.data?.tokenIn)
      return { id: matchingAsset?.id, name: matchingAsset?.name }
    })
    .filter((asset): asset is simplifiedAsset => asset !== undefined)

  const coingeckoPrices = useCoingeckoPrice(coingeckoAssetNames)

  const updatedSpotPrices = useMemo(() => {
    return spotPrices.map((spotPrices, index) => {
      if (spotPrices.data && spotPrices.data.spotPrice.isNaN()) {
        const coingeckoPrice = coingeckoPrices.data?.[spotPrices.data.tokenIn]

        if (coingeckoPrice) {
          return {
            ...spotPrices,
            data: {
              ...spotPrices.data,
              // @ts-ignore
              spotPrice: new BigNumber(coingeckoPrice),
            },
          }
        }
      }
      return spotPrices
    })
  }, [spotPrices, coingeckoPrices.data])

  return updatedSpotPrices
}

export const useCoingeckoPrice = (assets: simplifiedAsset[]) => {
  return useQuery(
    [QUERY_KEYS.coingeckoUsd, assets.map((asset) => asset.name)],
    async () => {
      const prices = await getCoingeckoAssetPrices(assets)
      return prices
    },
    {
      enabled: assets.length > 0,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      retry: false,
      staleTime: 1000 * 60 * 60, // 1h
    },
  )
}

export const getCoingeckoAssetPrices = async (
  assets: simplifiedAsset[],
): Promise<{ [key: string]: number }> => {
  const formattedAssetNames = assets
    .map((asset) => {
      let formattedName = asset.name.toLowerCase()
      if (asset.name.includes(" ")) {
        formattedName = asset.name.replace(/\s+/g, "-").toLowerCase()
      } else if (asset.name.toLowerCase() === "phala") {
        formattedName = "pha"
      } else if (asset.name.toLowerCase() === "glimmer") {
        formattedName = "moonbeam"
      }
      return formattedName
    })
    .join(",")

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${formattedAssetNames}&vs_currencies=usd`
  const res = await fetch(url)
  const json = await res.json()

  const pricesById: { [key: string]: number } = assets.reduce(
    (acc, asset) => {
      const formattedName = asset.name.toLowerCase().replace(/\s+/g, "-")
      acc[asset.id.toString()] = json[formattedName]?.usd || undefined
      return acc
    },
    {} as { [key: string]: number },
  )

  return pricesById
}
