import { useQuery } from "@tanstack/react-query"
import { ApiPromise } from "@polkadot/api"
import { QUERY_KEYS } from "utils/queryKeys"
import { REFETCH_INTERVAL } from "utils/constants"
import { useRpcProvider } from "providers/rpcProvider"
import { getTokenBalance } from "./balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import BigNumber from "bignumber.js"
import { TAsset, useAssets } from "providers/assets"

export const useOmnipoolAssets = (noRefresh?: boolean) => {
  const { api, isLoaded } = useRpcProvider()
  const { getAsset } = useAssets()

  return useQuery(
    noRefresh ? QUERY_KEYS.omnipoolAssets : QUERY_KEYS.omnipoolAssetsLive,
    async () => {
      const omnipoolAssets = await getOmnipoolAssets(api)()
      const assetsId = omnipoolAssets.map((asset) => asset.id.toString())
      const balances = await Promise.all(
        assetsId.map(
          async (assetId) =>
            await getTokenBalance(api, OMNIPOOL_ACCOUNT_ADDRESS, assetId)(),
        ),
      )

      return omnipoolAssets
        .map((asset) => {
          const id = asset.id.toString()
          const balance = balances.find(
            (balance) => balance.assetId.toString() === asset.id.toString(),
          )?.balance as BigNumber

          const meta = getAsset(id) as TAsset

          return {
            id,
            data: asset.data,
            meta,
            balance,
          }
        })
        .filter((asset) => asset.balance && asset.meta)
    },
    { enabled: isLoaded },
  )
}

export const useHubAssetTradability = () => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.hubAssetTradability, getHubAssetTradability(api))
}

export const getHubAssetTradability = (api: ApiPromise) => async () =>
  api.query.omnipool.hubAssetTradability()

export const getOmnipoolAssets = (api: ApiPromise) => async () => {
  const res = await api.query.omnipool.assets.entries()
  const data = res.map(([key, codec]) => {
    const [id] = key.args
    const data = codec.unwrap()
    return { id, data }
  })
  return data
}

export const useOmnipoolFee = () => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.omnipoolFee, getOmnipoolFee(api))
}

export const getOmnipoolFee = (api: ApiPromise) => async () => {
  const { minFee, maxFee } = await api.consts.dynamicFees.assetFeeParameters

  return {
    minFee: minFee.toBigNumber().div(1000000),
    maxFee: maxFee.toBigNumber().div(1000000),
  }
}

export const getHubAssetImbalance = (api: ApiPromise) =>
  api.query.omnipool.hubAssetImbalance()

export const useHubAssetImbalance = () => {
  const { api, isLoaded } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.hubAssetImbalance(),
    () => getHubAssetImbalance(api),
    {
      enabled: isLoaded,
      refetchInterval: REFETCH_INTERVAL,
    },
  )
}

export const useAllLiquidityPositions = () => {
  const { api, isLoaded } = useRpcProvider()

  return useQuery({
    queryKey: QUERY_KEYS.allOmnipoolPositions,
    queryFn: async () => {
      const collectionId = await api.consts.omnipool.nftCollectionId

      const [positions, uniques] = await Promise.all([
        api.query.omnipool.positions.entries(),
        api.query.uniques.asset.entries(collectionId.toString()),
      ])

      const data = positions.reduce<
        {
          amount: BigNumber
          shares: BigNumber
          price: string[]
          assetId: string
          owner: string
        }[]
      >((acc, [idRaw, dataRaw]) => {
        const id = idRaw.args[0].toString()

        const owner = uniques
          .find(([key]) => {
            const [, itemId] = key.args
            return itemId.toString() === id
          })?.[1]
          ?.unwrap()
          .owner.toString()

        if (owner) {
          const data = dataRaw.unwrap()

          acc.push({
            amount: data.amount.toBigNumber(),
            shares: data.shares.toBigNumber(),
            price: data.price.map((e) => e.toString()),
            assetId: data.assetId.toString(),
            owner,
          })
        }
        return acc
      }, [])

      return data
    },
    enabled: isLoaded,
  })
}
