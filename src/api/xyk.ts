import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { useRpcProvider } from "providers/rpcProvider"
import { QUERY_KEYS } from "utils/queryKeys"
import BigNumber from "bignumber.js"
import { isNotNil, undefinedNoop } from "utils/helpers"
import { useMemo } from "react"
import { TAsset } from "./assetDetails"

const getXYKPools = (api: ApiPromise) => async () => {
  const res = await api.query.xyk.poolAssets.entries()

  const data = res.map(([key, data]) => {
    const poolAddress = key.args[0].toString()
    //@ts-ignore
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
  const { api, assets } = useRpcProvider()

  return useQuery(QUERY_KEYS.shareTokens, async () => {
    const [shareToken, poolAssets] = await Promise.all([
      api.query.xyk.shareToken.entries(),
      api.query.xyk.poolAssets.entries(),
    ])
    const data = shareToken
      .map(([key, shareTokenIdRaw]) => {
        const poolAddress = key.args[0].toString()
        const shareTokenId = shareTokenIdRaw.toString()

        const xykAssets = poolAssets.find(
          (xykPool) => xykPool[0].args[0].toString() === poolAddress,
        )?.[1]

        if (xykAssets) {
          const assetsMeta = xykAssets.unwrapOr(null)?.map((asset) => {
            const meta = assets.getAsset(asset.toString())

            return meta
          })

          if (assetsMeta) {
            const [assetA, assetB] = assetsMeta

            if (!assetA.id || !assetB.id || !assetA.name || !assetB.name)
              return undefined
            const assetDecimal =
              Number(assetA.id) > Number(assetB.id) ? assetB : assetA
            const decimals = assetDecimal.decimals
            const symbol = `${assetA.symbol}/${assetB.symbol}`
            const name = `${assetA.name.split(" (")[0]}/${
              assetB.name.split(" (")[0]
            }`
            const iconId = [assetA.id, assetB.id]
            return {
              poolAddress,
              shareTokenId,
              assets: [assetA, assetB],
              meta: {
                decimals,
                symbol,
                name,
                id: shareTokenId,
                iconId,
              } as TAsset,
            }
          }

          return undefined
        }

        return undefined
      })
      .filter(isNotNil)

    return data
  })
}

export const useShareTokensByIds = (ids: string[]) => {
  const shareTokensQuery = useShareTokens()

  const shareTokens = useMemo(
    () =>
      shareTokensQuery.data?.filter((shareToken) =>
        ids.includes(shareToken.shareTokenId),
      ),
    [ids, shareTokensQuery.data],
  )

  return { ...shareTokensQuery, data: shareTokens }
}

export const useShareTokenById = (id: string) => {
  const shareTokensQuery = useShareTokens()

  const shareTokens = useMemo(
    () =>
      shareTokensQuery.data?.find(
        (shareToken) => id === shareToken.shareTokenId,
      ),
    [id, shareTokensQuery.data],
  )

  return { ...shareTokensQuery, data: shareTokens }
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
  //@ts-ignore
  return res?.toBigNumber() as BigNumber
}

export const useShareToken = () => {
  const shareTokensQuery = useShareTokens()

  const shareTokenMap = new Map(
    shareTokensQuery.data?.map((shareToken) => [
      shareToken.shareTokenId,
      shareToken,
    ]) ?? [],
  )

  const getShareToken = (id: string) => shareTokenMap.get(id)

  return { getShareToken, shareTokens: shareTokensQuery.data }
}
