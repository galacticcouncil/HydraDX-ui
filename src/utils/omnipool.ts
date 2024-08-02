import {
  calculate_liquidity_lrna_out,
  calculate_liquidity_out,
} from "@galacticcouncil/math-omnipool"
import { useOmnipoolAssets } from "api/omnipool"
import BN from "bignumber.js"
import { BN_NAN } from "utils/constants"
import { useDisplayPrices, useDisplayPrice } from "./displayAsset"
import { scale } from "./balance"
import { useCallback } from "react"
import { useAssets } from "providers/assets"
import { TOmnipoolPosition } from "api/deposits"

type IOptions = {
  sharesValue?: string
  fee?: string
}

export type TLPData = NonNullable<
  ReturnType<ReturnType<typeof useLiquidityPositionData>["getData"]>
>

export const useLiquidityPositionData = (assetsId?: string[]) => {
  const { hub } = useAssets()

  const omnipoolAssets = useOmnipoolAssets()
  const omnipoolAssetIds = omnipoolAssets.data?.map((asset) => asset.id) ?? []

  const hubSp = useDisplayPrice(hub.id)
  const spotPrices = useDisplayPrices(assetsId ?? omnipoolAssetIds)

  const getData = useCallback(
    (position: TOmnipoolPosition, options?: IOptions) => {
      const omnipoolAsset = omnipoolAssets.data?.find(
        (omnipoolAsset) => omnipoolAsset.id === position.assetId.toString(),
      )

      if (!omnipoolAsset) return undefined

      const spotPrice = spotPrices.data?.find(
        (sp) => sp?.tokenIn === omnipoolAsset.id,
      )?.spotPrice

      if (!spotPrice || !hubSp.data?.spotPrice) return undefined

      const [nom, denom] = position.price.map((n) => new BN(n.toString()))
      const price = nom.div(denom)

      const shares = position.shares

      const positionPrice = scale(price, "q")

      let lernaOutResult = "-1"
      let liquidityOutResult = "-1"

      const params: Parameters<typeof calculate_liquidity_out> = [
        omnipoolAsset.balance.toString(),
        omnipoolAsset.data.hubReserve.toString(),
        omnipoolAsset.data.shares.toString(),
        position.amount.toString(),
        position.shares.toString(),
        positionPrice.toFixed(0),
        options?.sharesValue ?? position.shares.toString(),
        options?.fee ?? "0",
      ]

      lernaOutResult = calculate_liquidity_lrna_out.apply(this, params)
      liquidityOutResult = calculate_liquidity_out.apply(this, params)

      const lrna = lernaOutResult !== "-1" ? new BN(lernaOutResult) : BN_NAN
      const lrnaShifted = lrna.shiftedBy(-hub.decimals)

      const value =
        liquidityOutResult !== "-1" ? new BN(liquidityOutResult) : BN_NAN
      const valueShifted = value.shiftedBy(-omnipoolAsset.meta.decimals)

      let valueDisplay = BN_NAN
      let valueDisplayWithoutLrna = BN_NAN
      let lrnaDisplay = BN_NAN
      let totalValue = value
      let totalValueShifted = valueShifted

      const amount = position.amount
      const amountShifted = amount.shiftedBy(-omnipoolAsset.meta.decimals)
      const amountDisplay = amountShifted.times(spotPrice)

      if (liquidityOutResult !== "-1") {
        valueDisplay = valueShifted.times(spotPrice)

        valueDisplayWithoutLrna = valueDisplay

        if (lrnaShifted.gt(0)) {
          lrnaDisplay = lrnaShifted.times(hubSp.data.spotPrice)
          valueDisplay = valueDisplay.plus(lrnaDisplay)

          totalValueShifted = valueDisplay.div(spotPrice)
          totalValue = scale(
            valueDisplay.div(spotPrice),
            omnipoolAsset.meta.decimals,
          )
        }
      }

      return {
        id: position.id,
        symbol: omnipoolAsset.meta.symbol,
        name: omnipoolAsset.meta.name,
        assetId: position.assetId,
        lrna,
        lrnaShifted,
        lrnaDisplay,
        value,
        valueShifted,
        valueDisplay,
        valueDisplayWithoutLrna,
        price: position.price,
        amount,
        amountDisplay,
        amountShifted,
        shares,
        totalValue,
        totalValueShifted,
        meta: omnipoolAsset.meta,
      }
    },
    [hub.decimals, hubSp.data?.spotPrice, omnipoolAssets.data, spotPrices.data],
  )

  return { getData }
}
