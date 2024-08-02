import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react"
import BN from "bignumber.js"
import { TAssetStored, useAssetRegistry, useSettingsStore } from "state/store"
import { Bond } from "@galacticcouncil/sdk"
import { useProviderRpcUrlStore } from "api/provider"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { HUB_ID, NATIVE_ASSET_ID } from "utils/api"
import { BN_0 } from "utils/constants"
import { ExternalAssetCursor } from "@galacticcouncil/apps"

const bannedAssets = ["1000042"]

type TAssetsContext = {
  all: Map<string, TAsset>
  tokens: TAsset[]
  stableswap: TAsset[]
  bonds: TBond[]
  external: TExternal[]
  externalInvalid: TExternal[]
  tradable: TAsset[]
  shareTokens: TShareToken[]
  native: TAsset
  hub: TAsset
  getAsset: (id: string) => TAsset | TShareToken | undefined
  getShareToken: (id: string) => TShareToken | undefined
  getShareTokens: (ids: string[]) => (TShareToken | undefined)[]
  getAssets: (ids: string[]) => (TAsset | TShareToken | undefined)[]
  getBond: (id: string) => TBond | undefined
  getAssetWithFallback: (id: string) => TAsset
  getExternalByExternalId: (externalId: string) => TExternal | undefined
  getShareTokenByAddress: (poolAddress: string) => TShareToken | undefined
  isExternal: (asset: TAsset) => asset is TExternal
  isBond: (asset: TAsset) => asset is TBond
  isStableSwap: (asset: TAsset) => boolean
  isShareToken: (asset: TAsset | undefined) => asset is TShareToken
}

const AssetsContext = createContext<TAssetsContext>({} as TAssetsContext)

export const useAssets = () => useContext(AssetsContext)

const getFullAsset = (asset: TAssetStored) => {
  const isToken = asset.type === "Token"
  const isBond = asset.type === "Bond"
  const isStableSwap = asset.type === "StableSwap"
  const isExternal = asset.type === "External"
  const isShareToken = false

  return {
    ...asset,
    parachainId: asset.origin?.toString(),
    existentialDeposit: BN(asset.existentialDeposit),
    isToken,
    isBond,
    isStableSwap,
    isExternal,
    isShareToken,
  }
}
const fallbackAsset: TAsset = {
  id: "",
  name: "N/A",
  symbol: "N/a",
  decimals: 12,
  existentialDeposit: BN_0,
  parachainId: undefined,
  isToken: false,
  isBond: false,
  isStableSwap: false,
  isExternal: false,
  isShareToken: false,
  iconId: "",
  isSufficient: false,
  isTradable: false,
  type: "Token",
  icon: "",
  externalId: undefined,
}

export type TAsset = ReturnType<typeof getFullAsset> & {
  iconId: string | string[]
}

export type TBond = TAsset & Bond

export type TExternal = TAsset & { externalId: string }

export type TShareToken = TAsset & {
  poolAddress: string
  assets: TAsset[]
}

export const AssetsProvider = ({ children }: { children: ReactNode }) => {
  const { assets, shareTokens: shareTokensRaw } = useAssetRegistry.getState()
  const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()
  const degenMode = useSettingsStore.getState().degenMode
  const { tokens: externalTokens } =
    degenMode && ExternalAssetCursor.deref()
      ? ExternalAssetCursor.deref().state
      : useUserExternalTokenStore.getState()

  const {
    all,
    stableswap,
    bonds,
    external,
    externalInvalid,
    tradable,
    native,
    hub,
    tokens,
  } = useMemo(() => {
    return assets.reduce<{
      all: Map<string, TAsset>
      tradable: TAsset[]
      tokens: TAsset[]
      stableswap: TAsset[]
      bonds: TBond[]
      external: TExternal[]
      externalInvalid: TExternal[]
      native: TAsset
      hub: TAsset
    }>(
      (acc, assetRaw) => {
        if (bannedAssets.includes(assetRaw.id)) return acc

        const asset = {
          ...getFullAsset(assetRaw),
          iconId:
            assetRaw.type === "Bond"
              ? (assetRaw as TBond).underlyingAssetId
              : assetRaw.meta
                ? Object.keys(assetRaw.meta)
                : assetRaw.id,
        }

        acc.all.set(asset.id, asset)

        if (asset.isTradable) {
          acc.tradable.push(asset)
        }

        if (asset.id === NATIVE_ASSET_ID) {
          acc.native = asset
        }

        if (asset.id === HUB_ID) {
          acc.hub = asset
        }

        if (asset.isToken) {
          acc.tokens.push(asset)
        } else if (asset.isStableSwap) {
          acc.stableswap.push(asset)
        } else if (asset.isBond) {
          acc.bonds.push(asset as TBond)
        } else if (asset.isExternal) {
          const externalId = externalTokens[dataEnv].find(
            (token) => token.internalId === asset.id,
          )?.id

          if (externalId) {
            acc.external.push({ ...asset, externalId })
          } else if (asset.externalId) {
            acc.external.push(asset as TExternal)
            acc.externalInvalid.push(asset as TExternal)
          }
        }

        return acc
      },
      {
        all: new Map([]),
        tradable: [],
        tokens: [],
        stableswap: [],
        bonds: [],
        external: [],
        externalInvalid: [],
        native: {} as TAsset,
        hub: {} as TAsset,
      },
    )
  }, [assets, dataEnv, externalTokens])

  const isExternal = (asset: TAsset): asset is TExternal => asset.isExternal
  const isBond = (asset: TAsset): asset is TBond => asset.isBond
  const isStableSwap = (asset: TAsset) => asset.isStableSwap
  const isShareToken = (asset: TAsset | undefined): asset is TShareToken =>
    asset ? asset.isShareToken : false

  const { shareTokens, shareTokensMap } = shareTokensRaw.reduce<{
    shareTokens: TShareToken[]
    shareTokensMap: Map<string, TShareToken>
  }>(
    (acc, token) => {
      const assetA = all.get(token.assets[0])
      const assetB = all.get(token.assets[1])

      if (assetA && assetB && assetA.symbol && assetB.symbol) {
        const assetDecimal =
          Number(assetA.id) > Number(assetB.id) ? assetB : assetA
        const decimals = assetDecimal.decimals
        const symbol = `${assetA.symbol}/${assetB.symbol}`
        const name = `${assetA.name.split(" (")[0]}/${assetB.name.split(" (")[0]}`
        const iconId = [
          isBond(assetA) ? assetA.underlyingAssetId : assetA.id,
          isBond(assetB) ? assetB.underlyingAssetId : assetB.id,
        ]

        const tokenFull = {
          ...fallbackAsset,
          id: token.shareTokenId,
          poolAddress: token.poolAddress,
          assets: [assetA, assetB],
          isShareToken: true,
          decimals,
          symbol,
          name,
          iconId,
        }
        acc.shareTokens.push(tokenFull)
        acc.shareTokensMap.set(tokenFull.id, tokenFull)
      }

      return acc
    },
    { shareTokens: [], shareTokensMap: new Map([]) },
  )

  const getAsset = useCallback(
    (id: string) =>
      new Map<string, TAsset | TShareToken>([...all, ...shareTokensMap]).get(
        id,
      ),
    [all, shareTokensMap],
  )
  const getAssetWithFallback = useCallback(
    (id: string) => getAsset(id) ?? fallbackAsset,
    [getAsset],
  )
  const getAssets = (ids: string[]) => ids.map((id) => getAsset(id))
  const getShareToken = useCallback(
    (id: string) => shareTokensMap.get(id),
    [shareTokensMap],
  )
  const getShareTokens = (ids: string[]) => ids.map((id) => getShareToken(id))

  const getShareTokenByAddress = useCallback(
    (poolAddress: string) =>
      shareTokens.find((shareToken) => shareToken.poolAddress === poolAddress),
    [shareTokens],
  )

  const getExternalByExternalId = useCallback(
    (externalId: string) =>
      external.find((token) => token.externalId === externalId),
    [external],
  )
  const getBond = useCallback(
    (id: string) => bonds.find((token) => token.id === id),
    [bonds],
  )

  return (
    <AssetsContext.Provider
      value={{
        all,
        tokens,
        stableswap,
        bonds,
        external,
        externalInvalid,
        tradable,
        shareTokens,
        native,
        hub,
        getAsset,
        getShareToken,
        getShareTokens,
        getAssets,
        getBond,
        getAssetWithFallback,
        getExternalByExternalId,
        getShareTokenByAddress,
        isExternal,
        isBond,
        isStableSwap,
        isShareToken,
      }}
    >
      {children}
    </AssetsContext.Provider>
  )
}
