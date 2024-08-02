import { getXYKVolumeAssetTotalValue, useXYKTradeVolumes } from "api/volume"
import { useMemo } from "react"
import { BN_0 } from "utils/constants"
import { useDisplayPrices } from "utils/displayAsset"
import { isNotNil } from "utils/helpers"
import { useAssets } from "providers/assets"

export const useXYKPoolTradeVolumes = (poolsAddress: string[]) => {
  const { getAsset } = useAssets()
  const volumes = useXYKTradeVolumes(poolsAddress)

  const values = useMemo(() => {
    return poolsAddress.map((poolAddress) => {
      const volume = volumes.find(
        (volume) => volume.data?.poolAddress === poolAddress,
      )

      const sums = getXYKVolumeAssetTotalValue(volume?.data)

      if (!volume?.data || !sums) return undefined

      return { poolAddress, assets: Object.keys(sums), sums }
    })
  }, [poolsAddress, volumes])

  // Get all uniques assets in pools
  const allAssetsInPools = [
    ...new Set(
      values.filter(isNotNil).reduce((acc, pool) => {
        if (!pool) return acc
        return [...acc, ...pool.assets]
      }, [] as string[]),
    ),
  ]

  const spotPrices = useDisplayPrices(allAssetsInPools)
  const isLoading =
    volumes.some((volume) => volume.isInitialLoading) ||
    spotPrices.isInitialLoading
  const data = useMemo(() => {
    if (!volumes || !values || !spotPrices.data) return

    const data = values
      .map((value) => {
        if (!value) return undefined
        const volume = value.assets.reduce((acc, asset) => {
          const assetMeta = getAsset(asset)
          const sum = value.sums[assetMeta?.id ?? ""]

          const spotPrice = spotPrices.data?.find(
            (spotPrice) => spotPrice?.tokenIn === asset,
          )?.spotPrice

          if (!sum || !spotPrice || !assetMeta) return acc
          const sumScale = sum.shiftedBy(-assetMeta.decimals)

          return acc.plus(sumScale.multipliedBy(spotPrice))
        }, BN_0)

        return { volume, poolAddress: value.poolAddress }
      })
      .filter(isNotNil)

    return data
  }, [getAsset, spotPrices, values, volumes])

  return { data, isLoading }
}
