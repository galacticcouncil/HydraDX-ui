import { ApiPromise } from "@polkadot/api"
import { Option } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { HydradxRuntimeXcmAssetLocation } from "@polkadot/types/lookup"
import { NATIVE_ASSET_ID } from "utils/api"
import { Maybe } from "utils/helpers"
import { useAccountBalances } from "./accountBalances"
import BN from "bignumber.js"
import { format } from "date-fns"
import { useRpcProvider } from "providers/rpcProvider"
import { Asset, PoolService, PoolType, TradeRouter } from "@galacticcouncil/sdk"
import { BN_0 } from "utils/constants"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { omit } from "utils/rx"
import { useProviderRpcUrlStore } from "./provider"
import { PENDULUM_ID } from "./externalAssetRegistry"
import { getGeneralIndex, getGeneralKey } from "utils/externalAssets"
import { ExternalAssetCursor } from "@galacticcouncil/apps"
import { useSettingsStore } from "state/store"

export const useAcountAssets = (address: Maybe<AccountId32 | string>) => {
  const { assets } = useRpcProvider()
  const accountBalances = useAccountBalances(address)

  const tokenBalances = accountBalances.data?.balances
    ? accountBalances.data.balances.map((balance) => {
        const asset = assets.getAsset(balance.id)

        return { asset, balance }
      })
    : []
  if (accountBalances.data?.native)
    tokenBalances.unshift({
      balance: accountBalances.data.native,
      asset: assets.native,
    })

  return tokenBalances
}

const getTokenParachainId = (
  rawLocation: Option<HydradxRuntimeXcmAssetLocation>,
) => {
  const location = rawLocation.unwrap()

  const type = location.interior.type
  if (location.interior && type !== "Here") {
    const xcm = location.interior[`as${type}`]

    const parachainId = !Array.isArray(xcm)
      ? xcm.asParachain.unwrap().toString()
      : xcm
          .find((el) => el.isParachain)
          ?.asParachain.unwrap()
          .toString()

    return parachainId
  }
}

type TAssetCommon = {
  id: string
  existentialDeposit: BN
  isToken: boolean
  isBond: boolean
  isStableSwap: boolean
  isShareToken: boolean
  isNative: boolean
  isExternal: boolean
  symbol: string
  decimals: number
  name: string
  parachainId: string | undefined
  iconId: string | string[]
  externalId?: string
  isSufficient: boolean
}

export type TBond = TAssetCommon & {
  assetType: "Bond"
  assetId: string
  maturity: number
  isTradable: boolean
}

export type TToken = TAssetCommon & {
  assetType: "Token"
  externalId?: string
}

export type TStableSwap = TAssetCommon & {
  assetType: "StableSwap"
  assets: string[]
}

export type TShareToken = TAssetCommon & {
  assetType: "ShareToken"
  assets: string[]
  poolAddress: string
}

export type TAsset = TToken | TBond | TStableSwap | TShareToken

export const fallbackAsset: TToken = {
  id: "",
  name: "N/A",
  symbol: "N/a",
  decimals: 12,
  assetType: "Token",
  existentialDeposit: BN_0,
  parachainId: undefined,
  isToken: false,
  isBond: false,
  isStableSwap: false,
  isShareToken: false,
  isExternal: false,
  isNative: false,
  iconId: "",
  isSufficient: false,
}

export const getAssets = async (api: ApiPromise) => {
  const poolService = new PoolService(api)
  const traderRoutes = [
    PoolType.Omni,
    PoolType.Stable,
    PoolType.XYK,
    PoolType.LBP,
  ]

  const tradeRouter = new TradeRouter(poolService, {
    includeOnly: traderRoutes,
  })

  let rawTradeAssets: Asset[] = []

  //TODO: remove after migrating to new asset registry
  const rawAssetsMeta = api.query.assetRegistry.assetMetadataMap
    ? await api.query.assetRegistry.assetMetadataMap.entries()
    : undefined

  const [
    system,
    rawAssetsData,
    rawAssetsLocations,
    hubAssetId,
    poolAddresses,
    xykPoolAssets,
    isReferralsEnabled,
    isDispatchPermitEnabled,
  ] = await Promise.all([
    api.rpc.system.properties(),
    api.query.assetRegistry.assets.entries(),
    api.query.assetRegistry.assetLocations.entries(),
    api.consts.omnipool.hubAssetId,
    api.query.xyk.shareToken.entries(),
    api.query.xyk.poolAssets.entries(),
    api.query.referrals,
    api.tx.multiTransactionPayment.dispatchPermit,
  ])

  const degenMode = useSettingsStore.getState().degenMode
  const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

  const { tokens: externalTokens } = degenMode
    ? ExternalAssetCursor.deref().state
    : useUserExternalTokenStore.getState()

  const tokens: TToken[] = []
  const bonds: TBond[] = []
  const stableswap: TStableSwap[] = []
  const shareTokensRaw = []
  const external: TToken[] = []

  for (const [key, dataRaw] of rawAssetsData) {
    if (!dataRaw.isNone) {
      const data = dataRaw.unwrap()
      const id = key.args[0].toString()

      const assetType = data.assetType.type

      const isToken = assetType === "Token"
      const isBond = assetType === "Bond"
      const isStableSwap = assetType === "StableSwap"
      //@ts-ignore
      const isShareToken = assetType === (!!rawAssetsMeta ? "PoolShare" : "XYK")
      //@ts-ignore
      const isExternal = assetType === "External"
      //@ts-ignore
      const isSufficient = data.isSufficient?.toPrimitive() ?? false

      let meta
      if (rawAssetsMeta) {
        const assetsMeta = rawAssetsMeta
          .find((meta) => meta[0].args[0].toString() === id)?.[1]
          .unwrap()

        meta = {
          decimals: assetsMeta?.decimals.toNumber() ?? 12,
          symbol: assetsMeta?.symbol.toUtf8() ?? "N/a",
        }
      } else {
        meta = {
          //@ts-ignore
          decimals: Number(data.decimals.toString()) as number,
          //@ts-ignore
          symbol: data.symbol.toHuman() as string,
        }
      }

      const assetCommon = {
        id,
        isToken,
        isBond,
        isStableSwap,
        isShareToken,
        isExternal,
        isNative: false,
        existentialDeposit: data.existentialDeposit.toBigNumber(),
        parachainId: undefined,
        name: data.name.toHuman() as string,
        isSufficient,
        ...meta,
      }

      if (isToken) {
        if (id === NATIVE_ASSET_ID) {
          const asset: TToken = {
            ...assetCommon,
            symbol: system.tokenSymbol.unwrap()[0].toString(),
            decimals: system.tokenDecimals.unwrap()[0].toNumber(),
            isNative: true,
            assetType,
            iconId: assetCommon.id,
          }
          tokens.push(asset)
        } else {
          const location = rawAssetsLocations.find(
            (location) => location[0].args[0].toString() === id,
          )?.[1]
          //@ts-ignore
          const asset: TToken = {
            ...assetCommon,
            parachainId:
              location && !location.isNone
                ? getTokenParachainId(location)
                : undefined,
            externalId: undefined,
            iconId: assetCommon.id,
          }

          tokens.push(asset)
        }
      } else if (isBond) {
        const detailsRaw = await api.query.bonds.bonds(id)

        if (!detailsRaw.isNone) {
          const details = detailsRaw.unwrap()
          const [assetIdRaw, maturity] = details ?? []
          const assetId = assetIdRaw.toString()

          let underlyingAsset: { symbol: string; decimals: number } | undefined

          if (assetId === NATIVE_ASSET_ID) {
            underlyingAsset = {
              symbol: system.tokenSymbol.unwrap()[0].toString(),
              decimals: system.tokenDecimals.unwrap()[0].toNumber(),
            }
          } else {
            const meta = (rawAssetsMeta ?? rawAssetsData).find(
              (meta) => meta[0].args[0].toString() === assetId,
            )
            if (meta) {
              const underlyingAssetMeta = meta[1].unwrap()
              underlyingAsset = {
                decimals: Number(
                  //@ts-ignore
                  underlyingAssetMeta.decimals.toString(),
                ) as number,
                //@ts-ignore
                symbol: underlyingAssetMeta.symbol.toHuman() as string,
              }
            }
          }

          if (underlyingAsset) {
            const symbol = `${underlyingAsset.symbol}b`
            const name = `${underlyingAsset.symbol} Bond ${format(
              new Date(maturity.toNumber()),
              "dd/MM/yyyy",
            )}`
            const decimals = underlyingAsset.decimals

            const location = rawAssetsLocations.find(
              (location) => location[0].args[0].toString() === assetId,
            )?.[1]

            const isTradable = false

            const asset: TBond = {
              ...assetCommon,
              assetId: assetId,
              name,
              assetType: "Bond",
              parachainId:
                location && !location.isNone
                  ? getTokenParachainId(location)
                  : undefined,
              decimals,
              symbol,
              maturity: maturity.toNumber(),
              isTradable,
              iconId: assetId,
            }

            bonds.push(asset)
          }
        }
      } else if (isStableSwap) {
        const decimals = 18

        const detailsRaw = await api.query.stableswap.pools(id)

        if (detailsRaw && !detailsRaw.isNone) {
          const details = detailsRaw.unwrap()
          const assets = details.assets.map((asset: any) => asset.toString())
          const symbol = `${assets.length}-Pool`

          const name = assets
            .map((assetId) => {
              if (assetId === NATIVE_ASSET_ID) {
                return system.tokenSymbol.unwrap()[0].toString()
              }

              const meta = (rawAssetsMeta ?? rawAssetsData)
                .find((meta) => meta[0].args[0].toString() === assetId)?.[1]
                .unwrap()

              if (meta) {
                // @ts-ignore
                return meta.symbol.toHuman() as string
              }

              return "N/A"
            })
            .join("/")

          const iconId = assets.map((asset) => asset)

          const asset: TStableSwap = {
            ...assetCommon,
            assetType: "StableSwap",
            decimals,
            assets,
            name,
            symbol,
            iconId,
          }
          stableswap.push(asset)
        }
      } else if (isShareToken) {
        const poolAddress = poolAddresses
          .find(
            (poolAddress) => poolAddress[1].toString() === assetCommon.id,
          )?.[0]
          .args[0].toString()

        if (poolAddress) {
          const poolAssets = xykPoolAssets.find(
            (xykPool) => xykPool[0].args[0].toString() === poolAddress,
          )?.[1]

          if (poolAssets) {
            const assets = poolAssets
              .unwrap()
              .map((poolAsset) => poolAsset.toString())

            shareTokensRaw.push({
              ...assetCommon,
              assets,
              poolAddress,
            })
          }
        }
      } else if (isExternal) {
        const location = rawAssetsLocations.find(
          (location) => location[0].args[0].toString() === id,
        )?.[1]
        const parachainId =
          location && !location.isNone
            ? getTokenParachainId(location)
            : undefined
        const externalTokenStored = externalTokens[dataEnv].find(
          (token) =>
            token.origin.toString() === parachainId &&
            token.internalId === assetCommon.id,
        )

        const externalId =
          location && !location.isNone
            ? parachainId === PENDULUM_ID.toString()
              ? getGeneralKey(location)
              : getGeneralIndex(location)
            : undefined

        const asset: TToken = {
          ...assetCommon,
          assetType,
          parachainId,
          externalId,
          iconId: "",
          ...(externalTokenStored
            ? omit(["id", "internalId", "origin"], {
                ...externalTokenStored,
                externalId: externalTokenStored.id,
              })
            : {}),
        }

        external.push(asset)
      }
    }
  }

  const native = tokens.find((token) => token.id === NATIVE_ASSET_ID) as TToken
  const hub = tokens.find(
    (token) => token.id === hubAssetId.toString(),
  ) as TToken

  const shareTokens = shareTokensRaw.reduce<Array<TShareToken>>(
    (acc, shareToken) => {
      if (!shareToken.assets) return acc

      const [assetAId, assetBId] = shareToken.assets

      const assetA = [...tokens, ...bonds, ...external].find(
        (token) => token.id === assetAId,
      ) as TToken
      const assetB = [...tokens, ...bonds, ...external].find(
        (token) => token.id === assetBId,
      ) as TToken

      const isValidTokens = assetA?.name && assetB?.name

      if (isValidTokens) {
        const assetDecimal =
          Number(assetA.id) > Number(assetB.id) ? assetB : assetA

        const decimals = assetDecimal.decimals
        const symbol = `${assetA.symbol}/${assetB.symbol}`
        const name = `${assetA.name.split(" (")[0]}/${
          assetB.name.split(" (")[0]
        }`
        const iconId = [assetA.id, assetB.id]

        acc.push({
          ...shareToken,
          decimals,
          symbol,
          name,
          assetType: "ShareToken",
          iconId,
        })
      }
      return acc
    },
    [],
  )

  // pass external tokens to trade router
  await poolService.syncRegistry(externalTokens[dataEnv])

  try {
    rawTradeAssets = await tradeRouter.getAllAssets()
  } catch (e) {}

  const tradableBonds = bonds.map((bond) => {
    const isTradable = rawTradeAssets.some(
      (tradeAsset) => tradeAsset.id === bond.id,
    )

    return { ...bond, isTradable }
  })

  return {
    assets: {
      tokens,
      bonds: tradableBonds,
      stableswap,
      shareTokens,
      external,
      native,
      hub,
      rawTradeAssets,
    },
    poolService,
    tradeRouter,
    featureFlags: {
      referrals: !!isReferralsEnabled,
      dispatchPermit: !!isDispatchPermitEnabled,
    },
  }
}
