import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import {
  ASSET_HUB_ID,
  TExternalAsset,
} from "sections/wallet/addToken/AddToken.utils"
import { Parachain, SubstrateApis } from "@galacticcouncil/xcm-core"
import { WsProvider } from "@polkadot/api"

type TRegistryChain = {
  assetCnt: string
  id: string
  paraID: number
  relayChain: "polkadot" | "kusama"
  data: (TExternalAsset & { currencyID: string })[]
}

const HYDRA_PARACHAIN_ID = 2034

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
          origin: provider.parachainId,
        }
      })
      return { data, id: provider.parachainId }
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

export const usePolkadotRegistry = () => {
  return useQuery(["polkadotRegistry"], async () => {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/colorfulnotion/xcm-global-registry/metadata/xcmgar.json",
    )
    const data = await res.json()
    let polkadotAssets: TRegistryChain[] = []

    try {
      polkadotAssets = data?.assets?.polkadot ?? []
    } catch (error) {}

    return polkadotAssets
  })
}

export const useParachainAmount = (id: string) => {
  const chains = usePolkadotRegistry()

  const validChains = chains.data?.reduce<any[]>((acc, chain) => {
    // skip asst hub and hydra chains
    if (chain.paraID === ASSET_HUB_ID || chain.paraID === HYDRA_PARACHAIN_ID)
      return acc

    const assets = chain.data

    const isAsset = assets.some((asset) => {
      try {
        return asset.currencyID === id
      } catch (error) {
        return false
      }
    })

    if (isAsset) {
      acc.push(chain)
    }

    return acc
  }, [])

  return { chains: validChains ?? [], amount: validChains?.length ?? 0 }
}
