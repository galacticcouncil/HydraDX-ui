// @ts-nocheck
import { ApiPromise, WsProvider } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { useRpcProvider } from "providers/rpcProvider"

export const getAssetHubAssets = async () => {
  const parachain = chainsMap.get("assethub")

  try {
    if (parachain) {
      const provider = new WsProvider(parachain.ws)
      const api = await ApiPromise.create({ provider })

      const dataRaw = await api.query.assets.metadata.entries()

      const data = dataRaw.map(([key, dataRaw]) => {
        const id = key.args[0].toString()
        const data = dataRaw

        return {
          id,
          decimals: data.decimals.toNumber() as number,
          symbol: data.symbol.toHuman() as string,
          name: data.name.toHuman() as string,
        }
      })
      return { data, id: parachain.parachainId.toString() }
    }
  } catch (e) {}
}

export const useExternalAssetRegistry = () => {
  const {
    assets: { getAsset },
  } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.externalAssetRegistry,
    async () => {
      const assetHub = await getAssetHubAssets()

      if (assetHub) {
        return { [assetHub.id]: assetHub.data }
      }
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    },
  )
}