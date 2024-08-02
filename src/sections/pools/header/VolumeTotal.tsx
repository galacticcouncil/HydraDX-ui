import { useGetXYKPools } from "api/xyk"
import { useXYKPoolTradeVolumes } from "sections/pools/pool/details/PoolDetails.utils"
import { BN_0 } from "utils/constants"
import { HeaderTotalData } from "./PoolsHeaderTotal"
import { usePools } from "sections/pools/PoolsPage.utils"
import { useAssets } from "providers/assets"

export const AllPoolsVolumeTotal = () => {
  const { getAssets } = useAssets()
  const xykPools = useGetXYKPools()
  const poolsAddress =
    xykPools.data
      ?.filter((pool) => getAssets(pool.assets).every((asset) => asset?.symbol))
      .map((pool) => pool.poolAddress) ?? []

  const xykVolumes = useXYKPoolTradeVolumes(poolsAddress)

  const pools = usePools()

  const isLoading =
    xykPools.isInitialLoading ||
    xykVolumes.isLoading ||
    pools.isLoading ||
    !!pools.data?.some((pool) => pool.isVolumeLoading)

  const totalVolumes = pools.data?.reduce(
    (memo, pool) => memo.plus(!pool.volume.isNaN() ? pool.volume : BN_0),
    BN_0,
  )

  const totalXYKVolume =
    xykVolumes.data?.reduce(
      (memo, volume) =>
        memo.plus(!volume.volume.isNaN() ? volume.volume : BN_0),
      BN_0,
    ) ?? BN_0

  const volumeTotal = totalVolumes?.div(2).plus(totalXYKVolume)

  return (
    <HeaderTotalData
      isLoading={isLoading}
      value={volumeTotal}
      fontSize={[19, 24]}
    />
  )
}

export const XYKVolumeTotal = () => {
  const { getAssets } = useAssets()
  const pools = useGetXYKPools()
  const poolsAddress =
    pools.data
      ?.filter((pool) => getAssets(pool.assets).every((asset) => asset?.symbol))
      .map((pool) => pool.poolAddress) ?? []
  const xykVolumes = useXYKPoolTradeVolumes(poolsAddress)

  const isLoading = pools.isInitialLoading || xykVolumes.isLoading

  const totalXYKVolume =
    xykVolumes.data?.reduce(
      (memo, volume) =>
        memo.plus(!volume.volume.isNaN() ? volume.volume : BN_0),
      BN_0,
    ) ?? BN_0

  return (
    <HeaderTotalData
      isLoading={isLoading}
      value={totalXYKVolume}
      fontSize={[19, 24]}
    />
  )
}

export const VolumeTotal = () => {
  const pools = usePools()

  const isLoading =
    pools.isLoading || !!pools.data?.some((pool) => pool.isVolumeLoading)

  const totalVolumes = pools.data?.reduce(
    (memo, pool) => memo.plus(pool.volume ?? BN_0),
    BN_0,
  )

  return (
    <HeaderTotalData
      isLoading={isLoading}
      value={totalVolumes?.div(2)}
      fontSize={[19, 24]}
    />
  )
}
