import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { SubstrateApis } from "@galacticcouncil/xcm-sdk"
import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { Maybe } from "utils/helpers"
import {
  ASSET_HUB_ID,
  TExternalAsset,
} from "sections/wallet/addToken/AddToken.utils"

export const HYDRADX_PARACHAIN_ACCOUNT =
  "13cKp89Uh2yWgTG28JA1QEvPUMjEPKejqkjHKf9zqLiFKjH6"

type TRegistryChain = {
  assetCnt: string
  id: string
  paraID: number
  relayChain: "polkadot" | "kusama"
  data: (TExternalAsset & { currencyID: string })[]
}

const HYDRA_PARACHAIN_ID = 2034

export const getAssetHubAssets = async () => {
  const parachain = chainsMap.get("assethub")

  try {
    if (parachain) {
      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(parachain.ws)

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

export const getAssetHubTokenBalance =
  (account: AccountId32 | string, id: string | u32) => async () => {
    const parachain = chainsMap.get("assethub")
    try {
      if (parachain) {
        const apiPool = SubstrateApis.getInstance()
        const api = await apiPool.api(parachain.ws)
        const codec = await api.query.assets.account(id, account)

        return {
          accountId: account,
          assetId: id,
          // @ts-ignore
          balance: codec.unwrap().balance.toBigNumber(),
        }
      }
    } catch (e) {}
  }

export const useAssetHubTokenBalance = (
  account: AccountId32 | string,
  id: string | u32,
) => {
  return useQuery(
    QUERY_KEYS.assetHubTokenBalance(account.toString(), id.toString()),
    getAssetHubTokenBalance(account, id),
    {
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    },
  )
}

export const useAssetHubTokenBalances = (
  account: AccountId32 | string,
  ids: Maybe<u32 | string>[],
) => {
  const tokenIds = ids.filter((id): id is u32 => !!id)

  return useQueries({
    queries: tokenIds.map((id) => ({
      queryKey: QUERY_KEYS.assetHubTokenBalance(
        account.toString(),
        id.toString(),
      ),
      queryFn: getAssetHubTokenBalance(account, id),
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    })),
  })
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
