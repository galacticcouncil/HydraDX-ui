import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { Parachain, SubstrateApis } from "@galacticcouncil/xcm-core"
import { HydradxRuntimeXcmAssetLocation } from "@polkadot/types/lookup"
import {
  TExternalAsset,
  TRegisteredAsset,
  useUserExternalTokenStore,
} from "sections/wallet/addToken/AddToken.utils"
import { isJson, isNotNil } from "utils/helpers"
import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { Fragment, useMemo } from "react"
import { useTotalIssuances } from "api/totalIssuance"
import { useRpcProvider } from "providers/rpcProvider"
import { zipArrays } from "utils/rx"
import BN from "bignumber.js"
import { BN_0 } from "utils/constants"
import SkullIcon from "assets/icons/SkullIcon.svg?react"
import WarningIcon from "assets/icons/WarningIcon.svg?react"
import WarningIconRed from "assets/icons/WarningIconRed.svg?react"

type TRegistryChain = {
  assetCnt: string
  id: string
  paraID: number
  relayChain: "polkadot" | "kusama"
  data: (TExternalAsset & { currencyID: string })[]
}

const HYDRA_PARACHAIN_ID = 2034
export const ASSET_HUB_ID = 1000
export const PENDULUM_ID = 2094
export const HYDRADX_PARACHAIN_ACCOUNT =
  "13cKp89Uh2yWgTG28JA1QEvPUMjEPKejqkjHKf9zqLiFKjH6"

export type RugSeverityLevel = "none" | "low" | "medium" | "high"
export const RUG_SEVERITY_LEVELS: RugSeverityLevel[] = [
  "none",
  "low",
  "medium",
  "high",
]
export const getIconByRugSeverity = (severity: RugSeverityLevel) => {
  switch (severity) {
    case "high":
      return SkullIcon
    case "medium":
      return WarningIconRed
    case "low":
      return WarningIcon
    default:
      return Fragment
  }
}

export type RugWarning = {
  type: "supply" | "symbol" | "decimals"
  severity: RugSeverityLevel
  diff: [number | string | BN, number | string | BN]
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
export const useExternalAssetRegistry = () => {
  const assetHub = useAssetHubAssetRegistry()
  const pendulum = usePendulumAssetRegistry()

  return {
    [ASSET_HUB_ID as number]: assetHub,
    [PENDULUM_ID as number]: pendulum,
  }
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

/**
 * Used for fetching tokens only from Pendulum parachain
 */
export const usePendulumAssetRegistry = () => {
  return useQuery(
    QUERY_KEYS.pendulumAssetRegistry,
    async () => {
      const pendulum = await getPedulumAssets()
      if (pendulum) {
        return pendulum.data
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

export const getAssetHubTokenBalance =
  (account: AccountId32 | string, id: string | u32) => async () => {
    const provider = chainsMap.get("assethub") as Parachain
    try {
      if (provider) {
        const apiPool = SubstrateApis.getInstance()
        const api = await apiPool.api(provider.ws)
        const codec = await api.query.assets.account(id, account)

        // @ts-ignore
        const balance = !codec.isNone
          ? // @ts-ignore
            codec.unwrap().balance.toBigNumber()
          : BN_0

        return {
          accountId: account,
          assetId: id,
          balance,
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
  ids: string[],
) => {
  return useQueries({
    queries: ids.map((id) => ({
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

export const useExternalTokensRugCheck = () => {
  const { assets, isLoaded } = useRpcProvider()
  const { getTokenByInternalId, isInRugCheckWhitelist } =
    useUserExternalTokenStore()

  const assetRegistry = useExternalAssetRegistry()

  const addedTokens = isLoaded
    ? assets.external.filter(({ name, symbol }) => !!name && !!symbol)
    : []

  const internalIds = addedTokens.map(({ id }) => id)
  const assetHubExternalIds = addedTokens
    .map(({ parachainId, externalId }) =>
      Number(parachainId) === ASSET_HUB_ID ? externalId : "",
    )
    .filter(isNotNil)

  const issuanceQueries = useTotalIssuances(internalIds)

  const balanceQueries = useAssetHubTokenBalances(
    HYDRADX_PARACHAIN_ACCOUNT,
    assetHubExternalIds,
  )

  const tokens = useMemo(() => {
    if (
      issuanceQueries.some(({ data }) => !data) ||
      balanceQueries.some(({ fetchStatus }) => fetchStatus !== "idle")
    ) {
      return []
    }

    const issuanceData = issuanceQueries.map((q) => q.data)
    const balanceData = balanceQueries.map((q) => q.data)

    return zipArrays(issuanceData, balanceData)
      .map(([issuance, balance]) => {
        if (!issuance?.token) return null

        const internalToken = assets.getAsset(issuance.token.toString())
        const storedToken = getTokenByInternalId(issuance.token.toString())
        const isWhitelisted = isInRugCheckWhitelist(internalToken.id)

        const externalAssetRegistry = internalToken.parachainId
          ? assetRegistry[+internalToken.parachainId]
          : null
        const externalToken = externalAssetRegistry?.data?.find(
          ({ id }) => internalToken.externalId === id,
        )

        if (!externalToken) return null
        if (!storedToken) return null

        const totalSupplyExternal =
          !isWhitelisted && balance?.balance ? BN(balance.balance) : null
        const totalSupplyInternal =
          !isWhitelisted && issuance?.total ? BN(issuance.total) : null

        const warnings = createRugWarningList({
          totalSupplyExternal,
          totalSupplyInternal,
          storedToken,
          externalToken,
        })

        const severity = warnings.reduce((acc, { severity }) => {
          return RUG_SEVERITY_LEVELS.indexOf(severity) >
            RUG_SEVERITY_LEVELS.indexOf(acc)
            ? severity
            : acc
        }, "low" as RugSeverityLevel)

        return {
          externalToken,
          totalSupplyExternal,
          internalToken,
          totalSupplyInternal,
          storedToken,
          warnings,
          severity,
        }
      })
      .filter(isNotNil)
  }, [
    assetRegistry,
    assets,
    balanceQueries,
    getTokenByInternalId,
    isInRugCheckWhitelist,
    issuanceQueries,
  ])

  const tokensMap = useMemo(() => {
    return new Map(tokens.map((token) => [token.internalToken.id, token]))
  }, [tokens])

  return {
    tokens,
    tokensMap,
  }
}

const createRugWarningList = ({
  totalSupplyExternal,
  totalSupplyInternal,
  storedToken,
  externalToken,
}: {
  totalSupplyExternal: BN | null
  totalSupplyInternal: BN | null
  storedToken: TRegisteredAsset
  externalToken: TExternalAsset
}) => {
  const warnings: RugWarning[] = []

  if (
    totalSupplyExternal &&
    totalSupplyInternal &&
    totalSupplyExternal.lt(totalSupplyInternal)
  ) {
    warnings.push({
      type: "supply",
      severity: "high",
      diff: [totalSupplyInternal ?? BN_0, totalSupplyExternal ?? BN_0],
    })
  }

  if (externalToken.symbol !== storedToken.symbol) {
    warnings.push({
      type: "symbol",
      severity: "medium",
      diff: [storedToken.symbol, externalToken.symbol],
    })
  }

  if (externalToken.decimals !== storedToken.decimals) {
    warnings.push({
      type: "decimals",
      severity: "medium",
      diff: [storedToken.decimals, externalToken.decimals],
    })
  }

  return warnings
}
