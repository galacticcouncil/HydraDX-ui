import { useExternalAssetRegistry } from "api/external"
import { useProviderRpcUrlStore, useRefetchProviderData } from "api/provider"
import { useRpcProvider } from "providers/rpcProvider"
import { useEffect, useMemo, useRef } from "react"
import {
  TRegisteredAsset,
  updateExternalAssetsCursor,
} from "sections/wallet/addToken/AddToken.utils"
import { useSettingsStore } from "state/store"

export const useDegenModeSubscription = () => {
  const { degenMode } = useSettingsStore()
  const externalAssets = useExternalAssetRegistry(degenMode)
  const { getDataEnv } = useProviderRpcUrlStore()
  const refetchProvider = useRefetchProviderData()
  const { assets, isLoaded } = useRpcProvider()

  const hasInitializedDegenMode = useRef(false)

  const { data, isSuccess } = useMemo(() => {
    const isSuccess = Object.values(externalAssets)
      .map(({ isSuccess }) => isSuccess)
      .every(Boolean)

    if (!isSuccess || !isLoaded) {
      return {
        data: [],
        isSuccess: false,
      }
    }

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

    return {
      data,
      isSuccess,
    }
  }, [assets, externalAssets, isLoaded])

  // Initialize ExternalAssetCursor if degenMode is true
  useEffect(() => {
    if (
      degenMode &&
      isSuccess &&
      data.length &&
      !hasInitializedDegenMode.current
    ) {
      updateExternalAssetsCursor(data, {
        degenMode,
        dataEnv: getDataEnv(),
      })
      hasInitializedDegenMode.current = true
      refetchProvider()
    }
  }, [degenMode, data, getDataEnv, isSuccess, refetchProvider])

  // Subscribe to degenMode change to update ExternalAssetCursor
  useEffect(() => {
    return useSettingsStore.subscribe((state, prevState) => {
      if (state.degenMode !== prevState.degenMode) {
        const { degenMode } = state
        if (data.length) {
          updateExternalAssetsCursor(data, {
            degenMode,
            dataEnv: getDataEnv(),
          })
          refetchProvider()
        }
      }
    })
  }, [data, getDataEnv, refetchProvider])
}
