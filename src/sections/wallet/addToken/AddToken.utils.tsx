import { useMutation } from "@tanstack/react-query"
import { ExternalAssetCursor } from "@galacticcouncil/apps"
import { useRpcProvider } from "providers/rpcProvider"
import { ToastMessage, useSettingsStore, useStore } from "state/store"
import {
  HydradxRuntimeXcmAssetLocation,
  XcmV3Junction,
} from "@polkadot/types/lookup"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { TOAST_MESSAGES } from "state/toasts"
import { Trans, useTranslation } from "react-i18next"
import {
  ASSET_HUB_ID,
  PENDULUM_ID,
  useExternalAssetRegistry,
} from "api/externalAssetRegistry"
import { TEnv, useProviderRpcUrlStore } from "api/provider"
import { isNotNil } from "utils/helpers"
import { u32 } from "@polkadot/types"
import { useMemo } from "react"
import { omit } from "utils/rx"
import { useShallow } from "hooks/useShallow"

const pink = {
  decimals: 10,
  id: "23",
  name: "PINK",
  origin: 1000,
  symbol: "PINK",
}

const ded = {
  decimals: 10,
  id: "30",
  name: "DED",
  origin: 1000,
  symbol: "DED",
}

const dota = {
  decimals: 4,
  id: "18",
  name: "DOTA",
  origin: 1000,
  symbol: "DOTA",
}

const version = 0.3

const testnet = [
  {
    ...ded,
    internalId: "1000017",
  },
  {
    ...pink,
    internalId: "1000018",
  },
  {
    ...dota,
    internalId: "1000023",
  },
]

const mainnet = [
  {
    ...ded,
    internalId: "1000019",
  },
  {
    ...pink,
    internalId: "1000021",
  },
  {
    ...dota,
    internalId: "1000038",
  },
]

const internalIds = new Map([
  ["9999", "1000106"],
  ["100", "1000053"],
  ["482", undefined],
  ["123", undefined],
  ["9000", "1000103"],
  ["69420", "1000062"],
  ["25518", "1000035"],
  ["420", "1000036"],
  ["10", undefined],
  ["256", "1000023"],
  ["4", "1000026"],
  ["21", undefined],
  ["20", undefined],
  ["999", undefined],
  ["30", "1000019"],
  ["101", undefined],
  ["99", undefined],
  ["7777", "1000095"],
  ["11", "1000027"],
  ["30035", "1000025"],
  ["111", undefined],
  ["555", "1000104"],
  ["14", "1000076"],
  ["6", undefined],
  ["65454", undefined],
  ["8889", "1000091"],
  ["8886", "1000108"],
  ["42069", "1000034"],
  ["77", undefined],
  ["9002", "1000105"],
  ["33", undefined],
  ["15", undefined],
  ["2", undefined],
  ["9527", undefined],
  ["868367", undefined],
  ["42", "1000060"],
  ["5", undefined],
  ["18", "1000038"],
  ["7", undefined],
  ["4294967295", "1000052"],
  ["1984", "10"],
  ["20090103", undefined],
  ["22", "1000055"],
  ["79", undefined],
  ["777", undefined],
  ["1230", undefined],
  ["9003", undefined],
  ["1313", undefined],
  ["24", undefined],
  ["2023", undefined],
  ["8", undefined],
  ["2820", undefined],
  ["404", "1000089"],
  ["1000", undefined],
  ["8008", undefined],
  ["6666", "1000078"],
  ["1", undefined],
  ["12", undefined],
  ["31337", "1000085"],
  ["3", undefined],
  ["6969", "1000054"],
  ["1983", undefined],
  ["1337", "22"],
  ["666", "1000029"],
  ["17", "1000082"],
  ["25", "1000069"],
  ["69", "1000094"],
  ["23", "1000021"],
  ["5417", "1000096"],
  ["9001", "1000102"],
  ["1980", undefined],
  ["4157", "1000065"],
  ["660301", undefined],
  ["9", "1000028"],
  ["862812", undefined],
  ["888", "1000059"],
  ["2024", "1000070"],
  ["2230", "1000073"],
])

export const SELECTABLE_PARACHAINS_IDS = [ASSET_HUB_ID, PENDULUM_ID]

export const PARACHAIN_CONFIG: {
  [x: number]: {
    palletInstance: string
    network: string
    parents: string
    interior: HydradxRuntimeXcmAssetLocation["interior"]["type"]
  }
} = {
  [ASSET_HUB_ID]: {
    palletInstance: "50",
    network: "polkadot",
    parents: "1",
    interior: "X3",
  },
}

export type TExternalAsset = {
  id: string
  decimals: number
  symbol: string
  name: string
  origin: number
}

export type TRegisteredAsset = TExternalAsset & { internalId: string }

export type InteriorTypes = {
  [x: string]: InteriorProp[]
}

export type InteriorProp = {
  [K in XcmV3Junction["type"]]: { [P in K]: any }
}[XcmV3Junction["type"]]

export const isGeneralKey = (
  prop: InteriorProp,
): prop is { GeneralKey: string } => {
  return typeof prop !== "string" && "GeneralKey" in prop
}

export type TExternalAssetInput = {
  parents: string
  interior: InteriorTypes | string
}

export const useRegisterToken = ({
  onSuccess,
  assetName,
}: {
  onSuccess: (assetId: string) => void
  assetName: string
}) => {
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const { t } = useTranslation()

  return useMutation(async (assetInput: TExternalAssetInput) => {
    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`wallet.addToken.toast.register.${msType}`}
          tOptions={{
            name: assetName,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    return await createTransaction(
      {
        tx: api.tx.assetRegistry.registerExternal(assetInput),
      },
      {
        toast,
        onSuccess: async (res) => {
          const data = res.events.find(
            (event) => event.event.method === "Registered",
          )?.event.data as { assetId?: u32 }

          const assetId = data?.assetId?.toString()

          if (assetId) onSuccess(assetId)
        },
      },
    )
  })
}

type Store = {
  tokens: {
    testnet: TRegisteredAsset[]
    mainnet: TRegisteredAsset[]
  }
  addToken: (TokensConversion: TRegisteredAsset) => void
  isAdded: (id: string | undefined) => boolean
}

export const useUserExternalTokenStore = create<Store>()(
  persist(
    (set, get) => ({
      tokens: {
        testnet,
        mainnet,
      },
      addToken: (token) =>
        set((store) => {
          const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

          const latest = {
            tokens: {
              ...store.tokens,
              [dataEnv]: [...store.tokens[dataEnv], token],
            },
          }

          ExternalAssetCursor.reset({
            state: { tokens: latest.tokens },
            version,
          })
          return latest
        }),
      isAdded: (id) => {
        const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

        return id
          ? get().tokens[dataEnv].some((token) => token.id === id)
          : false
      },
    }),

    {
      name: "external-tokens",
      version,
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState

        const { tokens: storedTokens } = persistedState as Store

        return {
          ...currentState,
          tokens: {
            ...storedTokens,
            mainnet: storedTokens.mainnet.map((token) =>
              token.id === "8889" ? { ...token, internalId: "1000091" } : token,
            ),
          },
        }
      },
      migrate: (persistedState) => {
        const state = persistedState as Store

        if (Array.isArray(state.tokens)) {
          const tokens = state.tokens
            .map((token) => {
              const internalId = internalIds.get(token.id)

              if (internalId) return { ...token, internalId }

              return undefined
            })
            .filter(isNotNil)

          return {
            ...state,
            tokens: {
              testnet,
              mainnet: tokens,
            },
          }
        }

        return state
      },
    },
  ),
)

export const useExternalTokenMeta = (id: string | undefined) => {
  const { assets } = useRpcProvider()
  const asset = id ? assets.getAsset(id) : undefined

  const externalRegistry = useExternalAssetRegistry()

  const externalAsset = useMemo(() => {
    if (asset?.externalId && asset?.isExternal && !asset?.symbol) {
      for (const parachain in externalRegistry) {
        const externalAsset = externalRegistry[Number(parachain)]?.data?.get(
          asset.externalId,
        )
        if (externalAsset) {
          const meta = assets.external.find(
            (asset) => asset.externalId === externalAsset.id,
          )

          if (meta) {
            const externalMeta = omit(["id"], externalAsset)

            return {
              ...meta,
              ...externalMeta,
              externalId: externalAsset.id,
            }
          }

          return undefined
        }
      }
    }

    return undefined
  }, [asset, externalRegistry, assets.external])

  return externalAsset
}

export const updateExternalAssetsCursor = (
  externalAssets: TRegisteredAsset[],
  options: { degenMode: boolean; dataEnv: TEnv },
) => {
  const { degenMode, dataEnv } = options
  const externalTokenState = useUserExternalTokenStore.getState()

  if (degenMode) {
    ExternalAssetCursor.reset({
      state: {
        tokens: {
          ...externalTokenState.tokens,
          [dataEnv]: externalAssets,
        },
      },
      version,
    })
  } else {
    ExternalAssetCursor.reset({
      state: {
        tokens: externalTokenState.tokens,
      },
      version,
    })
  }
}

export const useRegisteredExternalTokens = () => {
  const degenMode = useSettingsStore(useShallow((s) => s.degenMode))
  const { getDataEnv } = useProviderRpcUrlStore()
  const tokens = useUserExternalTokenStore(useShallow((s) => s.tokens))
  const dataEnv = getDataEnv()
  const { isLoaded, assets } = useRpcProvider()

  const externalAssets = useExternalAssetRegistry(degenMode)

  return useMemo(() => {
    if (degenMode && isLoaded) {
      const data = assets.external.reduce((acc, asset) => {
        const externalAsset = externalAssets[
          Number(asset.parachainId)
        ]?.data?.get(asset.externalId ?? "")

        if (externalAsset) {
          acc.push({
            ...externalAsset,
            internalId: asset.id,
          })
        }

        return acc
      }, [] as TRegisteredAsset[])
      return data
    } else {
      return tokens[dataEnv]
    }
  }, [assets.external, dataEnv, isLoaded, degenMode, externalAssets, tokens])
}
