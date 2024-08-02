import { useOmnipoolAssets } from "api/omnipool"
import { useSpotPrices } from "api/spotPrice"
import BN from "bignumber.js"
import { useMemo } from "react"
import { HYDRA_TREASURE_ACCOUNT } from "utils/api"
import { getFloatingPointAmount } from "utils/balance"
import { BN_0, BN_NAN, BN_QUINTILL } from "utils/constants"
import { useDisplayAssetStore } from "utils/displayAsset"
import { isNotNil } from "utils/helpers"
import { useFee, useTVL } from "api/stats"
import { useVolume } from "api/volume"
import { useLiquidityPositionData } from "utils/omnipool"
import { useAssets } from "providers/assets"
import { useAccountPositions } from "api/deposits"

const withoutRefresh = true

export const useOmnipoolAssetDetails = (sortBy: "tvl" | "pol") => {
  const { native } = useAssets()
  const accountPositions = useAccountPositions(HYDRA_TREASURE_ACCOUNT)
  const omnipoolAssets = useOmnipoolAssets(withoutRefresh)
  const { getData } = useLiquidityPositionData()
  const displayAsset = useDisplayAssetStore()

  const omnipoolAssetsIds =
    omnipoolAssets.data?.map((a) => a.id.toString()) ?? []

  const volumes = useVolume("all")
  const tvls = useTVL("all")
  const fees = useFee("all")

  const spotPrices = useSpotPrices(
    omnipoolAssetsIds,
    displayAsset.stableCoinId,
    withoutRefresh,
  )

  const queries = [omnipoolAssets, accountPositions, tvls, ...spotPrices]
  const isLoading = queries.some((q) => q.isLoading)

  const positions = accountPositions.data?.liquidityPositions

  const data = useMemo(() => {
    if (
      !omnipoolAssets.data ||
      !tvls.data ||
      spotPrices.some((q) => !q.data) ||
      !positions
    )
      return []

    // get a price of each position of HYDRA_TREASURE_ACCOUNT and filter it
    const treasurePositionsValue = positions.reduce(
      (acc, position) => {
        const data = getData(position)

        const assetId = position.assetId.toString()

        return {
          ...acc,
          [assetId]: data?.valueDisplay.plus(acc[assetId] ?? BN_0) ?? BN_NAN,
        }
      },
      {} as { [key: string]: BN },
    )

    const rows = omnipoolAssets.data.map((omnipoolAsset) => {
      const omnipoolAssetId = omnipoolAsset.id
      const shares = omnipoolAsset.data.shares.toString()
      const protocolShares = omnipoolAsset.data.protocolShares.toBigNumber()

      const meta = omnipoolAsset.meta

      const spotPrice = spotPrices.find(
        (sp) => sp?.data?.tokenIn === omnipoolAssetId,
      )?.data?.spotPrice

      const omnipoolAssetCap = omnipoolAsset.data.cap
        .toBigNumber()
        .div(BN_QUINTILL)

      if (!meta || !spotPrice) return null

      const free = getFloatingPointAmount(omnipoolAsset.balance, meta.decimals)

      const valueOfShares = protocolShares
        .div(shares)
        .multipliedBy(free)
        .times(spotPrice)

      const valueOfLiquidityPositions =
        treasurePositionsValue[omnipoolAssetId] ?? BN_0

      const pol = valueOfLiquidityPositions.plus(valueOfShares)

      const tvl = BN(
        tvls?.data?.find((tvl) => tvl.asset_id === Number(omnipoolAssetId))
          ?.tvl_usd ?? BN_NAN,
      )

      const volume = BN(
        volumes?.data?.find(
          (volume) => volume.asset_id === Number(omnipoolAssetId),
        )?.volume_usd ?? BN_NAN,
      )

      const fee =
        native.id === omnipoolAssetId
          ? BN_0
          : BN(
              fees?.data?.find(
                (fee) => fee.asset_id === Number(omnipoolAssetId),
              )?.projected_apr_perc ?? BN_NAN,
            )

      return {
        id: omnipoolAssetId,
        name: meta.name,
        symbol: meta.symbol,
        tvl,
        volume,
        pol,
        iconIds: meta.iconId,
        cap: omnipoolAssetCap,
        volumePol: BN(0),
        price: spotPrice,
        fee,
        isLoadingFee: fees?.isInitialLoading,
        isLoadingVolume: volumes.isInitialLoading,
      }
    })
    return rows
  }, [
    fees?.data,
    fees?.isInitialLoading,
    getData,
    native.id,
    omnipoolAssets.data,
    positions,
    spotPrices,
    tvls.data,
    volumes?.data,
    volumes.isInitialLoading,
  ])
    .filter(isNotNil)
    .sort((assetA, assetB) => {
      if (assetA.id === native.id) {
        return -1
      }

      if (assetB.id === native.id) {
        return 1
      }

      if (assetA[sortBy].isNaN()) return 1
      if (assetB[sortBy].isNaN()) return -1

      return assetA[sortBy].gt(assetB[sortBy]) ? -1 : 1
    })

  return { data, isLoading }
}

export type TUseOmnipoolAssetDetails = typeof useOmnipoolAssetDetails
export type TUseOmnipoolAssetDetailsData =
  ReturnType<TUseOmnipoolAssetDetails>["data"]
