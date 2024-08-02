import { useQuery, useQueries } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useIndexerUrl, useSquidUrl } from "./provider"
import { Maybe, undefinedNoop } from "utils/helpers"
import request, { gql } from "graphql-request"
import { useRpcProvider } from "providers/rpcProvider"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import BN from "bignumber.js"
import { TAsset, useAssets } from "providers/assets"

export type Bond = {
  assetId: string
  id: string
  name: string
  maturity: number
}

export const useLbpPool = (params?: { id?: string }) => {
  const { api } = useRpcProvider()

  const { id } = params ?? {}

  return useQuery(
    QUERY_KEYS.lbpPool,
    async () => {
      const raw = await api.query.lbp.poolData.entries()

      const data = raw.map(([key, rawData]) => {
        const data = rawData.unwrap()

        return {
          // @ts-ignore
          id: key.toHuman()[0] as string,
          owner: data.owner.toString(),
          start: Number(data.start.toString()),
          end: Number(data.end.toString()),
          assets: data.assets.map((asset) => asset.toNumber()),
          initialWeight: data.initialWeight.toNumber(),
          finalWeight: data.finalWeight.toNumber(),
          weightCurve: data.weightCurve.toString(),
          fee: data.fee.map((el) => el.toNumber()),
          feeCollector: data.feeCollector.toString(),
          repayTarget: data.repayTarget.toString(),
        }
      })

      return data
    },
    {
      enabled: !(params && !id),
      select: (pools) => {
        if (id) {
          const pool = pools.find((pool) =>
            pool.assets.some((asset: any) => asset === Number(id)),
          )

          return pool ? [pool] : undefined
        }

        return pools
      },
    },
  )
}

export const useBondsEvents = (
  bondIds: (string | undefined)[],
  isMyEvents?: boolean,
) => {
  const indexerUrl = useIndexerUrl()
  const { account } = useAccount()
  const accountHash = account?.address
    ? u8aToHex(decodeAddress(account.address))
    : undefined

  return useQueries({
    queries: bondIds.map((bondId) => ({
      queryKey: QUERY_KEYS.bondEvents(bondId, isMyEvents),
      queryFn: async () => {
        const { events } = await getBondEvents(
          indexerUrl,
          bondId,
          isMyEvents ? accountHash : undefined,
        )()
        return { events, bondId }
      },
      enabled: !!bondId,
    })),
  })
}

export const useBondsEventsSquid = (
  bondIds: (string | undefined)[],
  isMyEvents?: boolean,
) => {
  const { account } = useAccount()
  const accountHash = account?.address
    ? u8aToHex(decodeAddress(account.address))
    : undefined

  return useQueries({
    queries: bondIds.map((bondId) => ({
      queryKey: QUERY_KEYS.bondEventsSquid(bondId, isMyEvents),
      queryFn: async () => {
        const { swaps } = await getBondEventsSquid(
          bondId,
          isMyEvents ? accountHash : undefined,
        )()
        return { events: swaps, bondId }
      },
      enabled: !!bondId,
    })),
  })
}

const getBondEventsSquid =
  (bondId: Maybe<string>, who?: string) => async () => {
    //TODO: remove block filter argument, when it is tested on rococo rpc

    return {
      ...(await request<{
        swaps: Array<{
          swapPrice: number
          id: string
          type: string
          assetInAmount: string
          assetOutAmount: string
          paraChainBlockHeight: number
          assetInId: number
          assetOutId: number
          account: {
            id: string
          }
        }>
      }>(
        "https://squid.subsquid.io/hydradx-lbp-squid/graphql",
        gql`
          query BondTradesSquid($bondId: Int!, $who: String) {
            swaps(
              where: {
                account: { id_eq: $who }
                AND: { assetInId_eq: $bondId, OR: { assetOutId_eq: $bondId } }
              }
              orderBy: paraChainBlockHeight_DESC
            ) {
              swapPrice
              id
              type
              assetInAmount
              assetOutAmount
              paraChainBlockHeight
              assetInId
              assetOutId
              account {
                id
              }
            }
          }
        `,
        {
          bondId: Number(bondId),
          who,
        },
      )),
    }
  }

export const useBondEvents = (bondId?: string) => {
  const indexerUrl = useIndexerUrl()
  return useQuery(
    QUERY_KEYS.bondEvents(bondId),
    getBondEvents(indexerUrl, bondId),
    { enabled: !!bondId },
  )
}

type BondEvent = {
  args: {
    amount: string
    assetIn: number
    assetOut: number
    buyPrice: string
    salePrice: string
    feeAmount: string
    feeAsset: number
    who: string
  }
  block: {
    timestamp: string
  }
  extrinsic: {
    hash: string
  }
  name: string
}

const getBondEvents =
  (indexerUrl: string, bondId: Maybe<string>, who?: string) => async () => {
    //TODO: remove block filter argument, when it is tested on rococo rpc

    return {
      ...(await request<{
        events: Array<BondEvent>
      }>(
        indexerUrl,
        gql`
          query BondTrades($bondId: Int!, $who: String) {
            events(
              where: {
                args_jsonContains: { assetIn: $bondId, who: $who }
                block: { timestamp_gte: "2023-08-31T20:00:00.177000Z" }
                name_contains: "LBP"
                OR: {
                  args_jsonContains: { assetOut: $bondId, who: $who }
                  block: { timestamp_gte: "2023-08-31T20:00:00.177000Z" }
                  name_contains: "LBP"
                }
              }
              orderBy: [block_height_DESC]
            ) {
              name
              args
              block {
                timestamp
              }
              extrinsic {
                hash
              }
            }
          }
        `,
        {
          bondId: Number(bondId),
          who,
        },
      )),
    }
  }

export const useLBPPoolEvents = (bondId?: string) => {
  const indexerUrl = useIndexerUrl()

  return useQuery(
    QUERY_KEYS.lbpPoolTotal(bondId),
    async () => {
      const data = await getLbpPoolBalance(indexerUrl, bondId)()
      return {
        id: bondId,
        ...data,
      }
    },
    { enabled: !!bondId },
  )
}

export const useLBPPoolsEvents = (bondIds: string[]) => {
  const indexerUrl = useIndexerUrl()

  return useQueries({
    queries: bondIds.map((bondId) => ({
      queryKey: QUERY_KEYS.lbpPoolTotal(bondId),
      queryFn: async () => {
        const data = await getLbpPoolBalance(indexerUrl, bondId)()
        return {
          id: bondId,
          ...data,
        }
      },
      enabled: !!bondId,
    })),
  })
}

export const isPoolUpdateEvent = (
  event: LBPPoolEvents,
): event is LBPPoolUpdate => event.name === "LBP.PoolUpdated"

export const isPoolLiquidityEvent = (
  event: LBPPoolEvents,
): event is LBPPoolLiquidityEvent => event.name !== "LBP.PoolUpdated"

type LBPPoolLiquidityEvent = {
  args: {
    assetA: string
    assetB: string
    amountA: string
    amountB: string
    who: string
  }
  name: "LBP.LiquidityAdded" | "LBP.LiquidityRemoved"
  block: { height: number; timestamp: string }
}

type LBPPoolUpdate = {
  name: "LBP.PoolUpdated"
  args: {
    data: NonNullable<ReturnType<typeof useLbpPool>["data"]>[0]
    pool: string
  }
  block: { height: number; timestamp: string }
}

type LBPPoolEvents = LBPPoolLiquidityEvent | LBPPoolUpdate

const getLbpPoolBalance = (indexerUrl: string, bondId?: string) => async () => {
  return {
    ...(await request<{
      events: Array<LBPPoolEvents>
    }>(
      indexerUrl,
      gql`
        query LBPLiquidityAdded($bondId: Int) {
          events(
            where: {
              name_eq: "LBP.LiquidityAdded"
              args_jsonContains: { assetB: $bondId }
              OR: {
                args_jsonContains: { assetB: $bondId }
                name_contains: "LBP.LiquidityRemoved"
                OR: {
                  name_contains: "LBP.PoolUpdated"
                  args_jsonContains: { data: { assets: [$bondId] } }
                }
              }
            }
            orderBy: [block_height_ASC]
          ) {
            args
            name
            block {
              timestamp
              height
            }
          }
        }
      `,
      { bondId: Number(bondId) },
    )),
  }
}

export const useHistoricalPoolBalance = (pool?: string, block?: number) => {
  const url = useSquidUrl()

  return useQuery(
    QUERY_KEYS.poolHistoricalBalance(pool, block),
    !!pool && !!block
      ? getHistoricalPoolBalance(url, pool, block)
      : undefinedNoop,
    { enabled: !!pool && !!block },
  )
}

type THistoricalPoolBalance = {
  id: string
  assetBId: number
  assetAId: number
  historicalBalances: Array<{
    assetABalance: string
    assetBBalance: string
  }>
}

const getHistoricalPoolBalance =
  (url: string, pool: string, block: number) => async () => {
    return {
      ...(await request<{
        pools: Array<THistoricalPoolBalance>
      }>(
        url,
        gql`
          query PoolHistoricalBalance($pool: String, $block: Int) {
            pools(where: { id_eq: $pool }) {
              id
              assetBId
              assetAId
              historicalBalances(where: { paraChainBlockHeight_eq: $block }) {
                assetABalance
                assetBBalance
              }
            }
          }
        `,
        { pool: pool, block },
      )),
    }
  }

export const useLBPAveragePrice = (poolAddress?: string) => {
  const { getAssets } = useAssets()
  return useQuery(
    QUERY_KEYS.lbpAveragePrice(poolAddress),
    poolAddress
      ? async () => {
          const { historicalVolumes } = await getLBPAveragePrice(poolAddress)()
          const { assetAId, assetBId, averagePrice, id } =
            historicalVolumes?.[0] ?? []
          const [assetAMeta, assetBMeta] = getAssets([
            assetAId?.toString(),
            assetBId?.toString(),
          ]) as TAsset[]

          const price = BN(averagePrice).shiftedBy(
            assetBMeta.decimals - assetAMeta.decimals,
          )

          return { price, id }
        }
      : undefinedNoop,
    { enabled: !!poolAddress },
  )
}

const getLBPAveragePrice = (poolAddress: string) => async () => {
  return {
    ...(await request<{
      historicalVolumes: Array<{
        averagePrice: number
        assetAId: number
        assetBId: number
        id: string
      }>
    }>(
      "https://squid.subsquid.io/hydradx-lbp-squid/graphql",
      gql`
        query LBPAveragePrice($poolAddress: String) {
          historicalVolumes(
            orderBy: id_DESC
            limit: 1
            where: { id_contains: $poolAddress }
          ) {
            averagePrice
            assetAId
            assetBId
            id
          }
        }
      `,
      {
        poolAddress,
      },
    )),
  }
}
