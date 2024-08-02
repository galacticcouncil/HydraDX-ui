import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { useRpcProvider } from "providers/rpcProvider"
import { QUERY_KEYS } from "utils/queryKeys"
import { isNotNil, undefinedNoop } from "utils/helpers"
import { useAssetRegistry } from "state/store"
import { useActiveRpcUrlList, useProviderData } from "./provider"

const getXYKPools = (api: ApiPromise) => async () => {
  const res = await api.query.xyk.poolAssets.entries()

  const data = res.map(([key, data]) => {
    const poolAddress = key.args[0].toString()
    const assets = data.unwrap()?.map((el) => el.toString())
    return { poolAddress, assets }
  })

  return data
}

export const useGetXYKPools = () => {
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.xykPools, getXYKPools(api))
}

export const useShareTokens = () => {
  const { data: provider } = useProviderData()
  const { syncShareTokens } = useAssetRegistry.getState()
  const rpcUrlList = useActiveRpcUrlList()

  return useQuery(
    QUERY_KEYS.shareTokens(rpcUrlList.join()),
    provider
      ? async () => {
          const [shareToken, poolAssets] = await Promise.all([
            provider.api.query.xyk.shareToken.entries(),
            provider.api.query.xyk.poolAssets.entries(),
          ])
          const data = shareToken
            .map(([key, shareTokenIdRaw]) => {
              const poolAddress = key.args[0].toString()
              const shareTokenId = shareTokenIdRaw.toString()

              const xykAssets = poolAssets.find(
                (xykPool) => xykPool[0].args[0].toString() === poolAddress,
              )?.[1]

              if (xykAssets)
                return {
                  poolAddress,
                  shareTokenId,
                  assets: xykAssets.unwrap().map((asset) => asset.toString()),
                }

              return undefined
            })
            .filter(isNotNil)

          if (data.length) {
            syncShareTokens(data)
          }

          return data
        }
      : undefinedNoop,
    {
      enabled: !!provider,
      cacheTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 1,
    },
  )
}

export const useXYKConsts = () => {
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.xykConsts, getXYKConsts(api))
}

const getXYKConsts = (api: ApiPromise) => async () => {
  const [feeRaw, minTradingLimit, minPoolLiquidity] = await Promise.all([
    api.consts.xyk.getExchangeFee,
    api.consts.xyk.minTradingLimit,
    api.consts.xyk.minPoolLiquidity,
  ])

  const fee = feeRaw.map((el) => el.toString())

  return {
    fee: fee,
    minTradingLimit: minTradingLimit.toString(),
    minPoolLiquidity: minPoolLiquidity.toString(),
  }
}

export const useXYKTotalLiquidity = (address?: string) => {
  const { api } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.totalXYKLiquidity(address),
    address != null ? getXYKTotalLiquidity(api, address) : undefinedNoop,
    { enabled: !!address },
  )
}

const getXYKTotalLiquidity = (api: ApiPromise, address: string) => async () => {
  const res = await api.query.xyk.totalLiquidity(address)

  return res.toBigNumber()
}
