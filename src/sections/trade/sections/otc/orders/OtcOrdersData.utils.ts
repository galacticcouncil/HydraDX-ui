import { useMemo } from "react"
import { useOrdersData, useOrdersState, getOrderStateValue } from "api/otc"
import BN from "bignumber.js"
import { useAssetPrices } from "utils/displayAsset"
import { calculateDiffToRef } from "@galacticcouncil/sdk"

export const useOrdersTableData = () => {
  const treasuryAddr = import.meta.env.VITE_TRSRY_ADDR
  const orders = useOrdersData()
  const orderIds = orders.data?.map((order) => order.id)
  const ordersState = useOrdersState(orderIds || [])

  const assets = orders.data?.reduce(
    (acc, order) => {
      ;[order.assetIn, order.assetOut].forEach((asset) => {
        if (
          asset &&
          asset.id &&
          asset.name &&
          !acc.find((a) => a.id === asset.id)
        ) {
          acc.push({ id: asset.id, name: asset.name, symbol: asset.symbol })
        }
      })
      return acc
    },
    [] as { id: string; symbol: string; name: string }[],
  )

  const assetPrices = useAssetPrices(assets ?? [])

  const queries = [orders, ...ordersState, ...assetPrices]
  const isLoading = queries.some((q) => q.isLoading)
  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (!orders.data) return []
    return orders.data.map((order) => {
      const orderState = ordersState.find(
        (state) => state.data?.orderId === parseInt(order.id),
      )
      const orderStateValue = getOrderStateValue(orderState?.data)
      const amountInDp: number = order.assetIn?.decimals ?? 12
      const amountIn: BN = order.amountIn!.shiftedBy(-1 * amountInDp)
      const amountInInitial: string | undefined = orderStateValue?.amountIn
      const amountOutDp: number = order.assetOut?.decimals ?? 12
      const amountOut: BN = order.amountOut!.shiftedBy(-1 * amountOutDp)
      const amountOutInitial: string | undefined = orderStateValue?.amountOut

      const spotPriceInUSD = assetPrices?.find(
        (spotPrice) => spotPrice?.data?.tokenIn === order.assetIn?.id,
      )

      const valueOfAssetIn = amountIn.multipliedBy(
        spotPriceInUSD?.data?.spotPrice || 0,
      )
      const orderPrice = valueOfAssetIn.div(amountOut || 0)

      const marketPriceInUSD = assetPrices?.find(
        (spotPrice) => spotPrice?.data?.tokenIn === order.assetOut?.id,
      )
      const marketPrice = marketPriceInUSD?.data?.spotPrice || null

      let marketPricePercentage = 0
      if (marketPrice) {
        marketPricePercentage = calculateDiffToRef(
          marketPrice,
          orderPrice,
        ).toNumber()
      }

      return {
        id: order.id,
        owner: order.owner,
        offer: {
          initial:
            amountOutInitial &&
            new BN(amountOutInitial).shiftedBy(-1 * amountOutDp),
          amount: amountOut,
          asset: order.assetOut?.id,
          name: order.assetOut?.name,
          symbol: order.assetOut?.symbol,
        },
        accepting: {
          initial:
            amountInInitial &&
            new BN(amountInInitial).shiftedBy(-1 * amountInDp),
          amount: amountIn,
          asset: order.assetIn?.id,
          name: order.assetIn?.name,
          symbol: order.assetIn?.symbol,
        },
        price: amountIn.div(amountOut),
        orderPrice: orderPrice,
        marketPrice: marketPrice,
        marketPricePercentage: marketPricePercentage,
        partiallyFillable: order.partiallyFillable,
        pol: order.owner === treasuryAddr,
      } as OrderTableData
    })
  }, [orders.data, ordersState, treasuryAddr, assetPrices])

  return {
    data,
    isLoading,
    isInitialLoading,
  }
}

export type OrderTableData = {
  id: string
  owner: string
  offer: OfferingPair
  accepting: OfferingPair
  price: BN
  orderPrice: BN
  marketPrice: BN
  marketPricePercentage: number
  filled: string
  partiallyFillable: boolean
  pol: boolean
}

export type OfferingPair = {
  initial: BN | undefined
  amount: BN
  asset: string
  name: string
  symbol: string
}
