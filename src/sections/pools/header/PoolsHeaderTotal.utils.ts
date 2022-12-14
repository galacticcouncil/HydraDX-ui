import { useOmnipoolAssets, useOmnipoolPositions } from "api/omnipool"
import { useTokensBalances } from "api/balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { useSpotPrices } from "api/spotPrice"
import { useApiIds } from "api/consts"
import { useMemo } from "react"
import { useAssetMetaList } from "api/assetMeta"
import { BN_0, BN_10 } from "utils/constants"
import { useUniques } from "api/uniques"
import { useAccountStore } from "state/store"
import BN from "bignumber.js"
import { calculate_liquidity_out } from "@galacticcouncil/math/build/omnipool/bundler"

export const useTotalInPools = () => {
  const apiIds = useApiIds()
  const assets = useOmnipoolAssets()
  const metas = useAssetMetaList([
    apiIds.data?.usdId,
    ...(assets.data?.map((a) => a.id) ?? []),
  ])
  const balances = useTokensBalances(
    assets.data?.map((a) => a.id.toString()) ?? [],
    OMNIPOOL_ACCOUNT_ADDRESS,
  )
  const spotPrices = useSpotPrices(
    assets.data?.map((a) => a.id) ?? [],
    apiIds.data?.usdId,
  )

  const queries = [apiIds, assets, metas, ...balances, ...spotPrices]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !apiIds.data ||
      !assets.data ||
      !metas.data ||
      balances.some((q) => !q.data) ||
      spotPrices.some((q) => !q.data)
    )
      return undefined

    const total = assets.data
      .map((asset) => {
        const id = asset.id.toString()
        const meta = metas.data.find((m) => m.id === id)
        const balance = balances.find((b) => b.data?.assetId.toString() === id)
        const sp = spotPrices.find((sp) => sp.data?.tokenIn === id)

        if (!meta || !balance?.data?.balance || !sp?.data?.spotPrice)
          return BN_0

        const dp = BN_10.pow(meta.decimals.toString())
        const value = balance.data.balance.times(sp?.data?.spotPrice).div(dp)

        return value
      })
      .reduce((acc, curr) => acc.plus(curr), BN_0)

    return total
  }, [apiIds.data, assets.data, metas.data, balances, spotPrices])

  return { data, isLoading }
}

export const useUsersTotalInPools = () => {
  const { account } = useAccountStore()
  const apiIds = useApiIds()
  const uniques = useUniques(
    account?.address ?? "",
    apiIds.data?.omnipoolCollectionId ?? "",
  )
  const positions = useOmnipoolPositions(
    uniques.data?.map((u) => u.itemId) ?? [],
  )
  const assetIds = positions.data?.map((p) => p.assetId.toString()) ?? []
  const metas = useAssetMetaList([apiIds.data?.usdId.toString(), ...assetIds])
  const omnipoolAssets = useOmnipoolAssets()
  const omnipoolBalances = useTokensBalances(assetIds, OMNIPOOL_ACCOUNT_ADDRESS)
  const spotPrices = useSpotPrices(assetIds, apiIds.data?.usdId)

  const queries = [
    apiIds,
    uniques,
    positions,
    metas,
    omnipoolAssets,
    ...omnipoolBalances,
    ...spotPrices,
  ]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !apiIds.data ||
      !uniques.data ||
      !positions.data ||
      !metas.data ||
      !omnipoolAssets.data ||
      omnipoolBalances.some((q) => !q.data) ||
      spotPrices.some((q) => !q.data)
    )
      return undefined

    const totals = positions.data.map((position) => {
      const meta = metas.data.find(
        (m) => m.id.toString() === position.assetId.toString(),
      )
      const omnipoolAsset = omnipoolAssets.data.find(
        (a) => a.id.toString() === position.assetId.toString(),
      )
      const omnipoolBalance = omnipoolBalances.find(
        (b) => b.data?.assetId.toString() === position.assetId.toString(),
      )

      if (!meta || !omnipoolAsset?.data || !omnipoolBalance?.data) return BN_0

      const id = position.assetId.toString()

      const [nom, denom] = position.price.map((n) => new BN(n.toString()))
      const price = nom.div(denom)
      const positionPrice = price.times(BN_10.pow(18))

      const params: Parameters<typeof calculate_liquidity_out> = [
        omnipoolBalance.data.balance.toString(),
        omnipoolAsset.data.hubReserve.toString(),
        omnipoolAsset.data.shares.toString(),
        position.amount.toString(),
        position.shares.toString(),
        positionPrice.toFixed(),
        position.shares.toString(),
      ]

      const liquidityOutResult = calculate_liquidity_out.apply(this, params)
      if (liquidityOutResult === "-1") return BN_0

      const valueSp = spotPrices.find((sp) => sp.data?.tokenIn === id)
      const valueDp = BN_10.pow(meta.decimals.toBigNumber())
      const value = new BN(liquidityOutResult).div(valueDp)

      if (!valueSp?.data?.spotPrice) return BN_0

      const valueUSD = value.times(valueSp.data.spotPrice)

      return valueUSD
    })

    return totals.reduce((acc, total) => acc.plus(total), BN_0)
  }, [
    uniques.data,
    positions.data,
    metas.data,
    omnipoolAssets.data,
    apiIds.data,
    omnipoolBalances,
    spotPrices,
  ])

  return { data, isLoading }
}
