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
import { Fragment, useCallback, useMemo } from "react"
import { useTotalIssuances } from "api/totalIssuance"
import { useRpcProvider } from "providers/rpcProvider"
import BN from "bignumber.js"
import { BN_0, BN_NAN } from "utils/constants"
import SkullIcon from "assets/icons/SkullIcon.svg?react"
import WarningIcon from "assets/icons/WarningIcon.svg?react"
import WarningIconRed from "assets/icons/WarningIconRed.svg?react"
import { MetadataStore } from "@galacticcouncil/ui"
import { useAssets } from "providers/assets"

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
export const HYDRADX_PARACHAIN_ADDRESS =
  "13cKp89Uh2yWgTG28JA1QEvPUMjEPKejqkjHKf9zqLiFKjH6"
export const AH_TREASURY_ADDRESS =
  "13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB"

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
  type: "supply" | "symbol" | "name" | "decimals"
  severity: RugSeverityLevel
  diff: [number | string | BN, number | string | BN]
}

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

      const [dataRaw, assetsRaw] = await Promise.all([
        api.query.assets.metadata.entries(),
        api.query.assets.asset.entries(),
      ])

      const data: TExternalAsset[] = dataRaw.map(([key, dataRaw]) => {
        const id = key.args[0].toString()
        const data = dataRaw

        const asset = assetsRaw.find((asset) => asset[0].args.toString() === id)

        const supply = asset?.[1].unwrap().supply.toString()
        const admin = asset?.[1].unwrap().admin.toString()
        const owner = asset?.[1].unwrap().owner.toString()
        const isWhiteListed =
          admin === AH_TREASURY_ADDRESS && owner === AH_TREASURY_ADDRESS

        return {
          id,
          decimals: data.decimals.toNumber(),
          symbol: data.symbol.toHuman() as string,
          name: data.name.toHuman() as string,
          supply: supply ? BN(supply) : BN_NAN,
          origin: provider.parachainId,
          isWhiteListed,
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
            supply: BN_NAN,
            location: location[`as${type}`] as HydradxRuntimeXcmAssetLocation,
            origin: PENDULUM_ID,
            isWhiteListed: false,
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
  const { isLoaded } = useRpcProvider()

  const queryEnabled =
    typeof enabled === "boolean" ? enabled && isLoaded : isLoaded

  const assetHub = useAssetHubAssetRegistry(queryEnabled)
  const pendulum = usePendulumAssetRegistry(queryEnabled)

  return useMemo(
    () => ({
      [ASSET_HUB_ID as number]: assetHub,
      [PENDULUM_ID as number]: pendulum,
    }),
    [assetHub, pendulum],
  )
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

export type TRugCheckData = ReturnType<
  typeof useExternalTokensRugCheck
>["tokens"][number]

export const useExternalTokensRugCheck = (ids?: string[]) => {
  const { external, getAssetWithFallback } = useAssets()
  const { isLoaded } = useRpcProvider()
  const { getTokenByInternalId, isRiskConsentAdded } =
    useUserExternalTokenStore()

  const assetRegistry = useExternalAssetRegistry()
  const { getIsWhiteListed } = useExternalAssetsWhiteList()

  const { internalIds } = useMemo(() => {
    const externalAssets = isLoaded
      ? ids?.length
        ? external.filter((a) => ids?.some((id) => a.id === id))
        : external.filter(({ name, symbol }) => !!name && !!symbol)
      : []

    const internalIds = externalAssets.map(({ id }) => id)

    const assetHubExternalIds = externalAssets
      .map(({ parachainId, externalId }) =>
        Number(parachainId) === ASSET_HUB_ID ? externalId : "",
      )
      .filter(isNotNil)

    return { externalAssets, internalIds, assetHubExternalIds }
  }, [external, ids, isLoaded])

  const issuanceQueries = useTotalIssuances(internalIds)

  const tokens = useMemo(() => {
    if (issuanceQueries.some(({ data }) => !data)) {
      return []
    }

    const issuanceData = issuanceQueries.map((q) => q.data)

    return issuanceData
      .map((issuance) => {
        if (!issuance?.token) return null

        const internalToken = getAssetWithFallback(issuance.token.toString())
        const storedToken = getTokenByInternalId(issuance.token.toString())
        const shouldIgnoreRugCheck = isRiskConsentAdded(internalToken.id)

        const externalAssetRegistry = internalToken.parachainId
          ? assetRegistry[+internalToken.parachainId]
          : null
        const externalToken = externalAssetRegistry?.data?.get(
          internalToken.externalId ?? "",
        )

        if (!externalToken) return null

        const totalSupplyExternal =
          !shouldIgnoreRugCheck && !externalToken.supply.isNaN()
            ? externalToken.supply
            : null

        const totalSupplyInternal =
          !shouldIgnoreRugCheck && issuance?.total ? BN(issuance.total) : null

        const warnings = createRugWarningList({
          totalSupplyExternal: externalToken.supply,
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

        const { isWhiteListed, badge } = getIsWhiteListed(internalToken.id)

        return {
          externalToken,
          totalSupplyExternal,
          internalToken,
          totalSupplyInternal,
          storedToken,
          warnings,
          severity,
          badge,
          isWhiteListed,
        }
      })
      .filter(isNotNil)
  }, [
    assetRegistry,
    getAssetWithFallback,
    getIsWhiteListed,
    getTokenByInternalId,
    isRiskConsentAdded,
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
  externalToken: TExternalAsset
  storedToken?: TRegisteredAsset
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

  if (!storedToken) return warnings

  if (externalToken.symbol !== storedToken.symbol) {
    warnings.push({
      type: "symbol",
      severity: "medium",
      diff: [storedToken.symbol, externalToken.symbol],
    })
  }

  if (externalToken.name !== storedToken.name) {
    warnings.push({
      type: "name",
      severity: "medium",
      diff: [storedToken.name, externalToken.name],
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

export type ExternalAssetBadgeVariant = "warning" | "danger"

export const useExternalAssetsWhiteList = () => {
  const { isExternal, getAsset } = useAssets()
  const { isLoaded } = useRpcProvider()
  const assetRegistry = useExternalAssetRegistry()

  const whitelist = useMemo(
    () => MetadataStore.getInstance().externalWhitelist(),
    [],
  )

  const getIsWhiteListed = useCallback(
    (assetId: string) => {
      const asset = assetId ? getAsset(assetId) : undefined

      if (isLoaded && asset && isExternal(asset)) {
        const externalAsset = asset.parachainId
          ? assetRegistry[+asset.parachainId]?.data?.get(asset.externalId ?? "")
          : null

        const isManuallyWhiteListed = whitelist.includes(asset.id)
        const isWhiteListed =
          isManuallyWhiteListed ||
          asset?.isWhiteListed ||
          externalAsset?.isWhiteListed ||
          false

        const badge: ExternalAssetBadgeVariant = isWhiteListed
          ? "warning"
          : "danger"

        return {
          asset,
          isWhiteListed,
          badge,
        }
      }

      return {
        asset: null,
        isWhitelisted: false,
        badge: "" as ExternalAssetBadgeVariant,
      }
    },
    [getAsset, isLoaded, isExternal, assetRegistry, whitelist],
  )

  return {
    whitelist,
    getIsWhiteListed,
  }
}
