import { useSpotPrices } from "api/spotPrice"
import BN from "bignumber.js"
import { useMemo } from "react"
import { getFloatingPointAmount } from "utils/balance"
import { useDisplayAssetStore } from "utils/displayAsset"
import { isHydraAddress } from "utils/formatting"
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto"
import { HYDRA_ADDRESS_PREFIX } from "utils/api"
import { useAccountsIdentity } from "api/stats"
import {
  TradeType,
  isStableswapEvent,
  isTradeEvent,
  useAllTrades,
} from "api/volume"
import { groupBy } from "utils/rx"
import { isNotNil } from "utils/helpers"
import { BN_NAN } from "utils/constants"
import { useAssets } from "providers/assets"

const withoutRefresh = true

const EVENTS_LIMIT = 10

export const useRecentTradesTableData = (assetId?: string) => {
  const { getAsset } = useAssets()
  const allTrades = useAllTrades(assetId ? Number(assetId) : undefined)
  const displayAsset = useDisplayAssetStore()

  const address = allTrades.data?.events.map((event) => event.args.who) ?? []
  const identities = useAccountsIdentity(address)

  const events = useMemo(() => {
    if (!allTrades.data) return
    const groupedEvents = groupBy(
      allTrades.data.events,
      ({ extrinsic }) => extrinsic.hash,
    )

    return Object.entries(groupedEvents)
      .map(([, value]) => {
        const routerEvent = value.find(({ name }) => name === "Router.Executed")
        const tradeEvents = value.filter(isTradeEvent)
        const stableswapEvents = value.filter(isStableswapEvent)
        const [firstEvent] = tradeEvents

        if (!tradeEvents.length) return null
        if (firstEvent?.name === "Router.Executed") {
          const who = stableswapEvents?.[0]?.args?.who
          if (!who) return null
          return {
            value,
            ...firstEvent,
            args: {
              who: stableswapEvents[0].args.who,
              assetIn: firstEvent.args.assetIn,
              assetOut: firstEvent.args.assetOut,
              amountIn: firstEvent.args.amountIn,
              amountOut: firstEvent.args.amountOut,
            },
          }
        }

        let event: TradeType
        if (!routerEvent) {
          const lastEvent = tradeEvents[tradeEvents.length - 1]
          const assetIn = firstEvent.args.assetIn
          const assetOut = lastEvent.args.assetOut

          const stableswapIn = stableswapEvents.find(
            ({ args }) => args.poolId === assetIn,
          )
          const stableswapAssetIn = stableswapIn?.args?.assets?.[0]?.assetId
          const stableswapAmountIn = stableswapIn?.args?.assets?.[0]?.amount

          const stableswapOut = stableswapEvents.find(
            ({ args }) => args.poolId === assetOut,
          )
          const stableswapAssetOut = stableswapOut?.args?.amounts?.[0]?.assetId
          const stableswapAmountOut = stableswapIn?.args?.amounts?.[0]?.amount

          event = {
            ...firstEvent,
            args: {
              who: firstEvent.args.who,
              assetIn: stableswapAssetIn || assetIn,
              assetOut: stableswapAssetOut || assetOut,
              amountIn:
                stableswapAmountIn ||
                firstEvent.args.amount ||
                firstEvent.args.amountIn,
              amountOut:
                stableswapAmountOut ||
                lastEvent.args.amount ||
                lastEvent.args.amountOut,
            },
          }
        } else {
          event = {
            ...firstEvent,
            args: {
              ...firstEvent.args,
              ...routerEvent.args,
            },
          }
        }

        const assetInMeta = getAsset(event.args.assetIn.toString())
        const assetOutMeta = getAsset(event.args.assetOut.toString())

        if (!assetInMeta?.name || !assetOutMeta?.name) return null

        return event
      })
      .filter(isNotNil)
  }, [allTrades.data, getAsset])

  const assetIds = events
    ? events?.map(({ args }) => args.assetIn.toString())
    : []

  const spotPrices = useSpotPrices(
    assetIds,
    displayAsset.stableCoinId,
    withoutRefresh,
  )

  const queries = [allTrades, ...spotPrices, ...identities]

  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (!events || spotPrices.some((q) => !q.data)) return []

    const trades = events.reduce(
      (memo, trade) => {
        const isSelectedAsset = assetId
          ? assetId === trade.args.assetIn.toString() ||
            assetId === trade.args.assetOut.toString()
          : true

        if (
          isSelectedAsset &&
          !memo.find((memoTrade) => memoTrade.id === trade.id)
        ) {
          const isBuy =
            trade.name === "Omnipool.BuyExecuted" ||
            trade.name === "XYK.BuyExecuted"

          const assetIn = trade.args.assetIn.toString()
          const amountInRaw = new BN(trade.args.amountIn)
          const assetOut = trade.args.assetOut.toString()
          const amountOutRaw = new BN(trade.args.amountOut)

          const assetMetaIn = getAsset(assetIn)
          const assetMetaOut = getAsset(assetOut)

          const spotPriceIn = spotPrices.find(
            (spotPrice) => spotPrice?.data?.tokenIn === assetIn,
          )?.data

          const amountIn = getFloatingPointAmount(
            amountInRaw,
            assetMetaIn?.decimals ?? 12,
          )
          const amountOut = getFloatingPointAmount(
            amountOutRaw,
            assetMetaOut?.decimals ?? 12,
          )

          const tradeValue = amountIn.multipliedBy(
            spotPriceIn?.spotPrice ?? BN_NAN,
          )

          const hydraAddress = isHydraAddress(trade.args.who)
            ? trade.args.who
            : encodeAddress(decodeAddress(trade.args.who), HYDRA_ADDRESS_PREFIX)

          const identity = identities.find(
            (identity) => identity.data?.address === trade.args.who,
          )?.data?.identity

          const account = identity ?? hydraAddress

          if (assetMetaIn && assetMetaOut)
            memo.push({
              id: trade.id,
              isBuy,
              isSell: !isBuy,
              amountIn,
              amountOut,
              assetInSymbol: assetMetaIn.symbol,
              assetOutSymbol: assetMetaOut?.symbol,
              assetInId: assetMetaIn.id,
              assetOutId: assetMetaOut.id,
              tradeValue,
              account,
              date: new Date(trade.block.timestamp),
              extrinsicHash: trade.extrinsic?.hash,
              isIdentity: !!identity,
            })
        }
        return memo
      },
      [] as Array<{
        id: string
        isBuy: boolean
        isSell: boolean
        amountIn: BN
        amountOut: BN
        tradeValue: BN
        account: string
        assetInSymbol: string
        assetOutSymbol: string
        date: Date
        assetInId: string
        assetOutId: string
        extrinsicHash: string
        isIdentity: boolean
      }>,
    )

    return trades.slice(0, EVENTS_LIMIT)
  }, [events, spotPrices, assetId, getAsset, identities])

  return { data, isLoading: isInitialLoading }
}

export type TRecentTradesTable = typeof useRecentTradesTableData
export type TRecentTradesTableData = ReturnType<TRecentTradesTable>["data"]
