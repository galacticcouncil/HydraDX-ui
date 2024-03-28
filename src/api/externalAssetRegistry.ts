import { WsProvider } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { SubstrateApis } from "@galacticcouncil/xcm-sdk"

const parachain = chainsMap.get("assethub")
const assetHubProvider = new WsProvider(parachain?.ws)
const assetHubRococoProvider = new WsProvider(
  "wss://rococo-asset-hub-rpc.dwellir.com",
)

export const useAssetHubApi = () => {
  return useQuery(
    QUERY_KEYS.assetHubApi,
    async () => {
      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(assetHubRococoProvider.endpoint)

      return api
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    },
  )
}

export const getAssetHubAssets = async () => {
  try {
    if (parachain) {
      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(assetHubRococoProvider.endpoint)

      const dataRaw = await api.query.assets.metadata.entries()

      const data = dataRaw.map(([key, dataRaw]) => {
        const id = key.args[0].toString()
        const data = dataRaw

        return {
          id,
          // @ts-ignore
          decimals: data.decimals.toNumber() as number,
          // @ts-ignore
          symbol: data.symbol.toHuman() as string,
          // @ts-ignore
          name: data.name.toHuman() as string,
          origin: parachain.parachainId,
        }
      })
      return { data, id: parachain.parachainId }
    }
  } catch (e) {}
}

/**
 * Used for fetching tokens from supported parachains
 */
export const useExternalAssetRegistry = () => {
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

/**
 * Used for fetching tokens only from Asset Hub parachain
 */
export const useAssetHubAssetRegistry = () => {
  return useQuery(
    QUERY_KEYS.assetHubAssetRegistry,
    async () => {
      const assetHub = await getAssetHubAssets()

      if (assetHub) {
        return assetHub.data
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
