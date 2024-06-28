import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { Parachain, SubstrateApis } from "@galacticcouncil/xcm-core"
import { HydradxRuntimeXcmAssetLocation } from "@polkadot/types/lookup"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { isJson } from "utils/helpers"

type TRegistryChain = {
  assetCnt: string
  id: string
  paraID: number
  relayChain: "polkadot" | "kusama"
  data: (TExternalAsset & { currencyID: string })[]
}

export type TExternalAssetRegistry = ReturnType<typeof useExternalAssetRegistry>

const HYDRA_PARACHAIN_ID = 2034
export const ASSET_HUB_ID = 1000
export const PENDULUM_ID = 2094

const createMapFromAssetData = (data?: TExternalAsset[]) => {
  return new Map(
    (data || []).map((asset) => {
      return [asset.id, asset]
    }),
  )
}

const getPendulumAssetId = (assetId: string) => {
  const id = isJson(assetId) ? JSON.parse(assetId) : assetId

  if (id instanceof Object) {
    const key = Object.keys(id)[0]
    const data = id[key]

    if (key === "stellar") {
      const innerKey = Object.keys(data)[0]
      if (innerKey === "stellarNative") return innerKey

      const idHex = data?.alphaNum4?.code
      return idHex
    } else if (key === "xcm") {
      return undefined
    }
  }

  return undefined
}

export const getAssetHubAssets = async () => {
  const provider = chainsMap.get("assethub") as Parachain

  try {
    if (provider) {
      const api = await provider.api

      const dataRaw = await api.query.assets.metadata.entries()

      const data: TExternalAsset[] = dataRaw.map(([key, dataRaw]) => {
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

export const getPedulumAssets = async () => {
  try {
    const apiPool = SubstrateApis.getInstance()
    const api = await apiPool.api("wss://rpc-pendulum.prd.pendulumchain.tech")

    const dataRaw = await api.query.assetRegistry.metadata.entries()

    const data = dataRaw.reduce<
      Array<TExternalAsset & { location: HydradxRuntimeXcmAssetLocation }>
    >((acc, [key, dataRaw]) => {
      const idRaw = key.args[0].toString()

      //@ts-ignore
      const data = dataRaw.unwrap()
      const location = data.location.unwrap()

      if (location) {
        const type = location.type.toString()
        const interior = location[`as${type}`].interior.toString()

        const id = getPendulumAssetId(idRaw)
        if (interior !== "Here" && id)
          acc.push({
            id,
            // @ts-ignore
            decimals: data.decimals.toNumber() as number,
            // @ts-ignore
            symbol: data.symbol.toHuman() as string,
            // @ts-ignore
            name: data.name.toHuman() as string,
            location: location[`as${type}`] as HydradxRuntimeXcmAssetLocation,
            origin: PENDULUM_ID,
          })
      }

      return acc
    }, [])
    return { data, id: PENDULUM_ID }
  } catch (e) {}
}

/**
 * Used for fetching tokens from supported parachains
 */
export const useExternalAssetRegistry = (enabled?: boolean) => {
  const assetHub = useAssetHubAssetRegistry(enabled)
  const pendulum = usePendulumAssetRegistry(enabled)

  return {
    [ASSET_HUB_ID as number]: assetHub,
    [PENDULUM_ID as number]: pendulum,
  }
}

/**
 * Used for fetching tokens only from Asset Hub parachain
 */
export const useAssetHubAssetRegistry = (enabled?: boolean) => {
  return useQuery(
    QUERY_KEYS.assetHubAssetRegistry,
    async () => {
      const assetHub = await getAssetHubAssets()

      if (assetHub) {
        return assetHub.data
      }
    },
    {
      enabled,
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
      select: createMapFromAssetData,
    },
  )
}

/**
 * Used for fetching tokens only from Pendulum parachain
 */
export const usePendulumAssetRegistry = (enabled?: boolean) => {
  return useQuery(
    QUERY_KEYS.pendulumAssetRegistry,
    async () => {
      const pendulum = await getPedulumAssets()
      if (pendulum) {
        return pendulum.data
      }
    },
    {
      enabled,
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
      select: createMapFromAssetData,
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
