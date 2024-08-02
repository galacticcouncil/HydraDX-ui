import { useQueries, useQuery } from "@tanstack/react-query"
import { ApiPromise } from "@polkadot/api"
import { QUERY_KEYS } from "utils/queryKeys"
import { gql, request } from "graphql-request"
import { Maybe, undefinedNoop } from "utils/helpers"
import { useRpcProvider } from "providers/rpcProvider"
import { useAssets } from "providers/assets"

export const getOrders = (api: ApiPromise) => async () => {
  const res = await api.query.otc.orders.entries()
  const data = res.map(([key, codec]) => {
    if (!codec.isEmpty) {
      const data = codec.unwrap()
      return {
        id: key.args[0].toString(),
        owner: data.owner.toString(),
        assetIn: data.assetIn.toString(),
        assetOut: data.assetOut.toString(),
        amountIn: data.amountIn.toBigNumber(),
        amountOut: data.amountOut.toBigNumber(),
        partiallyFillable: data.partiallyFillable.toPrimitive(),
      }
    }
    return {
      id: key.args[0].toString(),
    }
  })
  return data
}

export const useOrders = () => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.otcOrders, getOrders(api))
}

export const useOrdersData = () => {
  const { api } = useRpcProvider()
  const { getAsset } = useAssets()

  return useQuery(QUERY_KEYS.otcOrdersTable, async () => {
    const orders = await getOrders(api)()

    return orders

      .map((order) => {
        return {
          ...order,
          assetIn: order.assetIn ? getAsset(order.assetIn) : undefined,
          assetOut: order.assetOut ? getAsset(order.assetOut) : undefined,
        }
      })
      .filter(
        (order) =>
          order.amountIn && order.amountOut && order.assetIn && order.assetOut,
      )
  })
}

export const getOrderState = (orderId: number) => async () => {
  return {
    orderId: orderId,
    ...(await request<{
      events: Array<{
        name: "OTC.Placed"
        args: {
          orderId: number
          assetIn: number
          assetOut: number
          amountIn: string
          amountOut: string
          partiallyFillable: boolean
        }
      }>
    }>(
      import.meta.env.VITE_INDEXER_URL,
      gql`
        query OrdersState($orderId: Int!) {
          events(
            where: {
              args_jsonContains: { orderId: $orderId }
              AND: { name_eq: "OTC.Placed" }
            }
          ) {
            name
            args
          }
        }
      `,
      { orderId },
    )),
  }
}

export function useOrdersState(orderIds: Maybe<string>[]) {
  return useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: QUERY_KEYS.otcOrdersState(orderId),
      queryFn:
        orderId != null ? getOrderState(parseInt(orderId)) : undefinedNoop,
      enabled: !!orderId,
    })),
  })
}

export function getOrderStateValue(
  state?: Awaited<ReturnType<ReturnType<typeof getOrderState>>>,
) {
  if (!state) return
  if (state.events.length === 0) return
  return state.events[0].args
}
