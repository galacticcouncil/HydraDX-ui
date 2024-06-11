import { useQueries, useQuery } from "@tanstack/react-query"
import { ApiPromise } from "@polkadot/api"
import { QUERY_KEYS } from "utils/queryKeys"
import { u128, u32 } from "@polkadot/types-codec"
import { undefinedNoop } from "utils/helpers"
import { REFETCH_INTERVAL } from "utils/constants"
import { useRpcProvider } from "providers/rpcProvider"

export const useOmnipoolAsset = (id: u32 | string) => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.omnipoolAsset(id), getOmnipoolAsset(api, id))
}

export const useOmnipoolAssets = (noRefresh?: boolean) => {
  const { api, isLoaded } = useRpcProvider()
  return useQuery(
    noRefresh ? QUERY_KEYS.omnipoolAssets : QUERY_KEYS.omnipoolAssetsLive,
    getOmnipoolAssets(api),
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

export const useOmnipoolPosition = (
  itemId: u128 | u32 | string | undefined,
) => {
  const { api } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.omnipoolPosition(itemId?.toString()),
    itemId != null
      ? getOmnipoolPosition(api, itemId.toString())
      : undefinedNoop,
    { enabled: itemId != null },
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
      assetId: data.assetId,
      amount: data.amount,
      shares: data.shares,
      price: data.price,
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
    const data = res.map((entry) => entry.unwrap())

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
