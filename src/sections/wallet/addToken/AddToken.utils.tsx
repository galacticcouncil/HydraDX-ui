import { useMutation } from "@tanstack/react-query"
import { ExternalAssetCursor } from "@galacticcouncil/apps"
import { useRpcProvider } from "providers/rpcProvider"
import { Transaction, useSettingsStore, useStore } from "state/store"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createToastMessages } from "state/toasts"
import { useTranslation } from "react-i18next"
import { assethub, pendulum, useExternalAssetRegistry } from "api/external"
import { TEnv, useProviderRpcUrlStore } from "api/provider"
import { isNotNil } from "utils/helpers"
import { u32 } from "@polkadot/types"
import { useCallback, useMemo } from "react"
import { omit } from "utils/rx"
import { getInputData, TExternalAssetWithLocation } from "utils/externalAssets"
import { useShallow } from "hooks/useShallow"
import { ISubmittableResult } from "@polkadot/types/types"

const pink = {
  decimals: 10,
  id: "23",
  name: "PINK",
  origin: 1000,
  symbol: "PINK",
  isWhiteListed: false,
}

const ded = {
  decimals: 10,
  id: "30",
  name: "DED",
  origin: 1000,
  symbol: "DED",
  isWhiteListed: false,
}

const dota = {
  decimals: 4,
  id: "18",
  name: "DOTA",
  origin: 1000,
  symbol: "DOTA",
  isWhiteListed: false,
}

const version = 0.4

const ahTreasuryAdminKeyIds = ["86"]

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

export const SELECTABLE_PARACHAINS_IDS = [
  assethub.parachainId,
  pendulum.parachainId,
]

export type TExternalAsset = {
  id: string
  decimals: number
  symbol: string
  name: string
  origin: number
  supply?: string
  isWhiteListed: boolean
}

export type TRegisteredAsset = Omit<TExternalAsset, "supply"> & {
  internalId: string
}

export const useRegisterToken = ({
  onSuccess,
  steps,
}: {
  onSuccess?: (assetId: string, asset: TExternalAssetWithLocation) => void
  steps?: Transaction["steps"]
} = {}) => {
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const { t } = useTranslation()

  return useMutation(async (asset: TExternalAssetWithLocation) => {
    const assetInput = getInputData(asset)

    if (!assetInput) throw new Error("Invalid asset input data")

    return await createTransaction(
      {
        title: t("wallet.addToken.reviewTransaction.modal.register.title"),
        tx: api.tx.assetRegistry.registerExternal(assetInput),
      },
      {
        steps,
        toast: createToastMessages("wallet.addToken.toast.register", {
          t,
          tOptions: {
            name: asset.name,
          },
          components: ["span.highlight"],
        }),
        onSuccess: async (res) => {
          const data = getInternalIdFromResult(res)
          const assetId = data?.assetId?.toString()

          if (assetId) onSuccess?.(assetId, asset)
        },
      },
    )
  })
}

type Store = {
  riskConsentIds: {
    testnet: string[]
    mainnet: string[]
  }
  tokens: {
    testnet: TRegisteredAsset[]
    mainnet: TRegisteredAsset[]
  }
  addTokenConsent: (id: string) => void
  isRiskConsentAdded: (id: string) => boolean
  addToken: (TokensConversion: TRegisteredAsset) => void
  getTokenByInternalId: (interlanlId: string) => TRegisteredAsset | undefined
  isAdded: (id: string | undefined) => boolean
}

export const useUserExternalTokenStore = create<Store>()(
  persist(
    (set, get) => ({
      riskConsentIds: {
        testnet: [],
        mainnet: [],
      },
      tokens: {
        testnet,
        mainnet,
      },
      addTokenConsent: (id) => {
        set((store) => {
          const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()
          return {
            riskConsentIds: {
              ...store.riskConsentIds,
              [dataEnv]: [...store.riskConsentIds[dataEnv], id],
            },
          }
        })
      },
      addToken: (token) =>
        set((store) => {
          const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

          const existingToken = store.tokens[dataEnv].find(
            ({ origin, id }) => origin === token.origin && id === token.id,
          )

          const updatedTokens = existingToken
            ? store.tokens[dataEnv].map((currentToken) => {
                if (
                  currentToken.origin === token.origin &&
                  currentToken.id === token.id
                ) {
                  return token
                }
                return currentToken
              })
            : [...store.tokens[dataEnv], token]

          const latest = {
            tokens: {
              ...store.tokens,
              [dataEnv]: updatedTokens,
            },
          }

          ExternalAssetCursor.reset({
            state: { tokens: latest.tokens },
            version,
          })
          return latest
        }),
      getTokenByInternalId: (internalId) => {
        const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

        return get().tokens[dataEnv].find(
          (token) => token.internalId === internalId,
        )
      },
      isRiskConsentAdded: (id: string) => {
        const dataEnv = useProviderRpcUrlStore.getState().getDataEnv()

        return id ? get().riskConsentIds[dataEnv].includes(id) : false
      },
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

        if (state.tokens.mainnet) {
          const mainnet = state.tokens.mainnet.map((token) => ({
            ...token,
            isWhiteListed: ahTreasuryAdminKeyIds.includes(token.id),
          }))

          const testnet = state.tokens.testnet.map((token) => ({
            ...token,
            isWhiteListed: ahTreasuryAdminKeyIds.includes(token.id),
          }))

          return {
            ...state,
            tokens: {
              testnet,
              mainnet,
            },
          }
        }

        return state
      },
    },
  ),
)

export const useExternalTokenMeta = () => {
  const { assets } = useRpcProvider()

  const externalRegistry = useExternalAssetRegistry()

  const getExtrernalToken = useCallback(
    (id: string) => {
      const meta = id ? assets.getAsset(id) : undefined

      if (meta?.isExternal && meta.externalId) {
        for (const parachain in externalRegistry) {
          const externalAsset = externalRegistry[Number(parachain)]?.data?.get(
            meta.externalId,
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
    },
    [assets, externalRegistry],
  )

  return getExtrernalToken
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

export const getInternalIdFromResult = (res: ISubmittableResult) => {
  const data = res.events.find((event) => event.event.method === "Registered")
    ?.event.data

  if (!data) {
    return { assetId: undefined }
  }

  return data as { assetId?: u32 }
}
