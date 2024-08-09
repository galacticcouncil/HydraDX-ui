import { useQueries, useQuery } from "@tanstack/react-query"
import { ApiPromise } from "@polkadot/api"
import { QUERY_KEYS } from "utils/queryKeys"
import { u128, u32 } from "@polkadot/types-codec"
import { undefinedNoop } from "utils/helpers"
import { REFETCH_INTERVAL } from "utils/constants"
import { useRpcProvider } from "providers/rpcProvider"
import { getTokenBalance } from "./balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import BigNumber from "bignumber.js"

export type TOmnipoolAsset = NonNullable<
  ReturnType<typeof useOmnipoolAssets>["data"]
>[number]

export const useOmnipoolAssets = (noRefresh?: boolean) => {
  const { api, isLoaded, assets } = useRpcProvider()

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

          const meta = assets.getAsset(id)

          return {
            id,
            data: asset.data,
            meta,
            balance,
          }
        })
        .filter((asset) => asset.balance)
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

export const getOmnipoolAsset =
  (api: ApiPromise, id: u32 | string) => async () => {
    const res = await api.query.omnipool.assets(id)
    return res.unwrap()
  }

export const getOmnipoolAssets = (api: ApiPromise) => async () => {
  const res = await api.query.omnipool.assets.entries()
  const data = res.map(([key, codec]) => {
    const [id] = key.args
    const data = codec.unwrap()
    return { id, data }
  })
  return data
}

export const useOmnipoolPositions = (
  itemIds: Array<u128 | u32 | undefined | string>,
  noRefresh?: boolean,
) => {
  const { api } = useRpcProvider()

  return useQueries({
    queries: itemIds.map((id) => ({
      queryKey: noRefresh
        ? QUERY_KEYS.omnipoolPosition(id?.toString())
        : QUERY_KEYS.omnipoolPositionLive(id?.toString()),
      queryFn:
        id != null ? getOmnipoolPosition(api, id.toString()) : undefinedNoop,
      enabled: !!id,
    })),
  })
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

export type OmnipoolPosition = Awaited<
  ReturnType<ReturnType<typeof getOmnipoolPosition>>
>

export const getOmnipoolPosition =
  (api: ApiPromise, itemId: string) => async () => {
    const res = await api.query.omnipool.positions(itemId)
    const data = res.unwrap()

    const position = {
      id: itemId,
      assetId: data.assetId.toString(),
      amount: data.amount.toBigNumber(),
      shares: data.shares.toBigNumber(),
      price: data.price.map((el) => el.toString()),
    }

    return position
  }

export const useOmnipoolPositionsMulti = (
  itemIds: Array<u128 | u32 | undefined>,
  noRefresh?: boolean,
) => {
  const { api } = useRpcProvider()

  return useQuery({
    queryKey: noRefresh
      ? QUERY_KEYS.omnipoolPositionsMulti(itemIds.map((id) => id?.toString()))
      : QUERY_KEYS.omnipoolPositionsMultiLive(
          itemIds.map((id) => id?.toString()),
        ),
    queryFn: getOmnipoolPositions(api, itemIds),
    enabled: itemIds.length > 0,
  })
}

export const getOmnipoolPositions =
  (api: ApiPromise, itemIds: Array<u128 | u32 | undefined>) => async () => {
    const res = await api.query.omnipool.positions.multi(itemIds)
    const data = res.map((entry) => {
      const data = entry.unwrap()
      return {
        amount: data.amount.toBigNumber(),
        shares: data.shares.toBigNumber(),
        price: data.price.map((e) => e.toString()),
        assetId: data.assetId.toString(),
      }
    })

    return data
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

export const useOmnipoolMinLiquidity = () => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.omnipoolMinLiquidity, getOmnipoolMinLiquidity(api))
}

const getOmnipoolMinLiquidity = (api: ApiPromise) => async () => {
  const data = await api.consts.omnipool.minimumPoolLiquidity

  return data.toBigNumber()
}
