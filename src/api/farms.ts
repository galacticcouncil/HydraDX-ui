import { ApiPromise } from "@polkadot/api"
import { u32 } from "@polkadot/types"
import { BlockNumber } from "@polkadot/types/interfaces"
import {
  PalletLiquidityMiningGlobalFarmData,
  PalletLiquidityMiningYieldFarmData,
} from "@polkadot/types/lookup"
import { useQueries, useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { secondsInYear } from "date-fns"
import { BLOCK_TIME, BN_0, PARACHAIN_BLOCK_TIME } from "utils/constants"
import { Maybe, isNotNil, undefinedNoop, useQueryReduce } from "utils/helpers"
import { QUERY_KEYS } from "utils/queryKeys"
import { useBestNumber } from "./chain"
import { fixed_from_rational } from "@galacticcouncil/math-liquidity-mining"
import BN from "bignumber.js"
import { useRpcProvider } from "providers/rpcProvider"
import { useIndexerUrl } from "./provider"
import request, { gql } from "graphql-request"
import { AccountId32 } from "@polkadot/types/interfaces"

const NEW_YIELD_FARMS_BLOCKS = (48 * 60 * 60) / PARACHAIN_BLOCK_TIME.toNumber() // 48 hours

export function useActiveYieldFarms(poolIds: Array<Maybe<u32 | string>>) {
  const { api } = useRpcProvider()

  return useQueries({
    queries: poolIds.map((poolId) => ({
      queryKey: QUERY_KEYS.activeYieldFarms(poolId),
      queryFn:
        poolId != null ? getActiveYieldFarms(api, poolId) : undefinedNoop,
      enabled: poolId != null,
    })),
  })
}

export const getActiveYieldFarms =
  (api: ApiPromise, poolId: u32 | string) => async () => {
    const res =
      await api.query.omnipoolWarehouseLM.activeYieldFarm.entries(poolId)
    return res.map(([storageKey, codec]) => {
      const [poolId, globalFarmId] = storageKey.args
      const yieldFarmId = codec.unwrap()
      return { poolId, globalFarmId, yieldFarmId }
    })
  }

export function useYieldFarms(
  ids: Maybe<
    {
      poolId: u32 | string
      globalFarmId: u32 | string
      yieldFarmId: u32 | string
    }[]
  >,
) {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.yieldFarms(ids),
    ids != null ? getYieldFarms(api, ids) : undefinedNoop,
    { enabled: ids != null },
  )
}

const getYieldFarms =
  (
    api: ApiPromise,
    ids: {
      poolId: u32 | string
      globalFarmId: u32 | string
      yieldFarmId: u32 | string
    }[],
  ) =>
  async () => {
    const res = await Promise.all(
      ids.map(({ poolId, globalFarmId, yieldFarmId }) =>
        api.query.omnipoolWarehouseLM.yieldFarm(
          poolId,
          globalFarmId,
          yieldFarmId,
        ),
      ),
    )

    return res.map((data) => data.unwrap())
  }

export function useYieldFarm(data: {
  poolId: Maybe<u32 | string>
  globalFarmId: Maybe<u32 | string>
  yieldFarmId: Maybe<u32 | string>
}) {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.yieldFarm(data),
    data.poolId != null && data.globalFarmId != null && data.yieldFarmId != null
      ? getYieldFarm(api, data.poolId, data.globalFarmId, data.yieldFarmId)
      : undefinedNoop,
    {
      enabled:
        data.poolId != null &&
        data.globalFarmId != null &&
        data.yieldFarmId != null,
    },
  )
}

const getYieldFarm =
  (
    api: ApiPromise,
    poolId: u32 | string,
    globalFarmId: u32 | string,
    yieldFarmId: u32 | string,
  ) =>
  async () => {
    const yieldFarm = await api.query.omnipoolWarehouseLM.yieldFarm(
      poolId,
      globalFarmId,
      yieldFarmId,
    )
    return yieldFarm.unwrap()
  }

export function useGlobalFarm(id: Maybe<u32 | string>) {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.globalFarm(id),
    id != null ? getGlobalFarm(api, id) : undefinedNoop,
    { enabled: id != null },
  )
}

const getGlobalFarm = (api: ApiPromise, id: u32 | string) => async () => {
  const globalFarm = await api.query.omnipoolWarehouseLM.globalFarm(id)
  return globalFarm.unwrap()
}

export function useGlobalFarms(ids: Maybe<{ globalFarmId: u32 }[]>) {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.globalFarms(ids),
    ids != null ? getGlobalFarms(api, ids) : undefinedNoop,
    { enabled: ids != null },
  )
}

const getGlobalFarms =
  (api: ApiPromise, ids: { globalFarmId: u32 }[]) => async () => {
    const globalFarms = await api.query.omnipoolWarehouseLM.globalFarm.multi(
      ids.map((i) => i.globalFarmId),
    )
    return globalFarms.map((i) => i.unwrap())
  }

export interface Farm {
  globalFarm: PalletLiquidityMiningGlobalFarmData
  yieldFarm: PalletLiquidityMiningYieldFarmData
  poolId: string
}

export type FarmAprs = ReturnType<typeof useFarmAprs>

export type FarmQueryType = ReturnType<typeof useFarms>

export const useFarms = (poolIds: Array<u32 | string>) => {
  const activeYieldFarms = useActiveYieldFarms(poolIds)

  const data = activeYieldFarms
    .reduce(
      (acc, farm) => {
        if (farm.data) acc.push(farm.data)
        return acc
      },
      [] as Array<Array<FarmIds>>,
    )
    .flat(2)

  const globalFarms = useGlobalFarms(data)
  const yieldFarms = useYieldFarms(data)

  return useQueryReduce(
    [globalFarms, yieldFarms, ...activeYieldFarms] as const,
    (globalFarms, yieldFarms, ...activeYieldFarms) => {
      const farms =
        activeYieldFarms.flat(2).map((af) => {
          if (!af) return undefined

          const globalFarm = globalFarms?.find((gf) =>
            af.globalFarmId.eq(gf.id),
          )
          const yieldFarm = yieldFarms?.find((yf) => af.yieldFarmId.eq(yf.id))
          if (!globalFarm || !yieldFarm) return undefined
          return { globalFarm, yieldFarm, poolId: af.poolId.toString() }
        }) ?? []

      return farms.filter((x): x is Farm => x != null)
    },
  )
}

function getGlobalRewardPerPeriod(
  totalSharesZ: BigNumber,
  yieldPerPeriod: BigNumber,
  maxRewardPerPeriod: BigNumber,
  priceAdjustemnt: BigNumber,
) {
  const globalRewardPerPeriod_ = totalSharesZ
    .times(yieldPerPeriod)
    .shiftedBy(-18)

  const globalRewardPerPeriod = globalRewardPerPeriod_
    .times(priceAdjustemnt)
    .shiftedBy(-18)

  const isFarmFull = globalRewardPerPeriod.gte(maxRewardPerPeriod)

  return isFarmFull ? maxRewardPerPeriod : globalRewardPerPeriod
}

function getPoolYieldPerPeriod(
  globalRewardPerPeriod: BigNumber,
  multiplier: BigNumber,
  totalSharesZ: BigNumber,
  priceAdjustemnt: BigNumber,
) {
  return globalRewardPerPeriod
    .times(multiplier)
    .div(totalSharesZ.times(priceAdjustemnt).shiftedBy(-18))
}

function getFarmApr(
  bestNumber: {
    parachainBlockNumber: BlockNumber
    relaychainBlockNumber: u32
  },
  farm: Farm,
  priceAdjustment: BigNumber,
) {
  const { globalFarm, yieldFarm } = farm
  const { rewardCurrency, incentivizedAsset } = globalFarm

  const loyaltyFactor = yieldFarm.loyaltyCurve.isNone
    ? null
    : yieldFarm.loyaltyCurve
        .unwrap()
        .initialRewardPercentage.toBigNumber()
        .shiftedBy(-18)

  const loyaltyCurve = yieldFarm.loyaltyCurve.unwrapOr(null)
  const totalSharesZ = globalFarm.totalSharesZ.toBigNumber()
  const plannedYieldingPeriods = globalFarm.plannedYieldingPeriods.toBigNumber()
  const yieldPerPeriod = globalFarm.yieldPerPeriod.toBigNumber()

  const maxRewardPerPeriod = globalFarm.maxRewardPerPeriod.toBigNumber()
  const blocksPerPeriod = globalFarm.blocksPerPeriod.toBigNumber()
  const currentPeriod = bestNumber.relaychainBlockNumber
    .toBigNumber()
    .dividedToIntegerBy(blocksPerPeriod)
  const blockTime = BLOCK_TIME
  const multiplier = yieldFarm.multiplier.toBigNumber().shiftedBy(-18)
  const secondsPerYear = new BigNumber(secondsInYear)
  const periodsPerYear = secondsPerYear.div(blockTime.times(blocksPerPeriod))

  let apr
  if (totalSharesZ.isZero()) {
    apr = yieldPerPeriod.times(multiplier).times(periodsPerYear)
  } else {
    const globalRewardPerPeriod = getGlobalRewardPerPeriod(
      totalSharesZ,
      yieldPerPeriod,
      maxRewardPerPeriod,
      priceAdjustment,
    )
    const poolYieldPerPeriod = getPoolYieldPerPeriod(
      globalRewardPerPeriod,
      multiplier,
      totalSharesZ,
      priceAdjustment,
    )

    apr = poolYieldPerPeriod.times(periodsPerYear)
  }

  // max distribution of rewards
  // https://www.notion.so/Screen-elements-mapping-Farms-baee6acc456542ca8d2cccd1cc1548ae?p=4a2f16a9f2454095945dbd9ce0eb1b6b&pm=s
  const distributedRewards = globalFarm.pendingRewards
    .toBigNumber()
    .plus(globalFarm.accumulatedPaidRewards.toBigNumber())

  const maxRewards = maxRewardPerPeriod.times(plannedYieldingPeriods)
  const leftToDistribute = maxRewards.minus(distributedRewards)

  // estimate, when the farm will most likely distribute all the rewards
  const updatedAtPeriod = globalFarm.updatedAt.toBigNumber()
  const periodsLeft = leftToDistribute.div(maxRewardPerPeriod)

  // if there are no deposits, the farm is not running and distributing rewards
  const estimatedEndPeriod = totalSharesZ.gte(0)
    ? updatedAtPeriod.plus(periodsLeft)
    : currentPeriod.plus(periodsLeft)

  const estimatedEndBlock = estimatedEndPeriod.times(blocksPerPeriod)

  // fullness of the farm
  // interpreted as how close are we to the cap of yield per period
  // https://www.notion.so/FAQ-59697ce6fd2e46e1b8f9093ba4606e88#446ee616be484c5e86e5eb82d3a29455

  const fullness = totalSharesZ
    .div(maxRewardPerPeriod.div(yieldPerPeriod))
    .shiftedBy(-18)
    .times(100)
    .times(priceAdjustment.shiftedBy(-18))

  const isDistributed = distributedRewards.div(maxRewards).gte(0.99)

  // multiply by 100 since APR should be a percentage
  apr = isDistributed ? BN_0 : apr.times(100)

  const minApr = loyaltyFactor ? apr.times(loyaltyFactor) : null

  return {
    apr,
    minApr,
    distributedRewards,
    maxRewards,
    fullness,
    estimatedEndBlock: estimatedEndBlock,
    assetId: globalFarm.rewardCurrency,
    currentPeriod,
    loyaltyCurve,
    rewardCurrency,
    incentivizedAsset,
    yieldFarmId: yieldFarm.id.toString(),
    isDistributed,
  }
}

export const useFarmApr = (farm: {
  globalFarm: PalletLiquidityMiningGlobalFarmData
  yieldFarm: PalletLiquidityMiningYieldFarmData
  poolId: string
}) => {
  const bestNumber = useBestNumber()
  const rewardCurrency = farm.globalFarm.rewardCurrency.toString()
  const incentivizedAsset = farm.globalFarm.incentivizedAsset.toString()

  const oraclePrice = useOraclePrice(rewardCurrency, incentivizedAsset)

  return useQueryReduce(
    [bestNumber, oraclePrice] as const,
    (bestNumber, oraclePrice) => {
      return getFarmApr(bestNumber, farm, oraclePrice?.oraclePrice ?? BN_0)
    },
  )
}

export const useFarmAprs = (
  farms: {
    globalFarm: PalletLiquidityMiningGlobalFarmData
    yieldFarm: PalletLiquidityMiningYieldFarmData
    poolId: string
  }[],
) => {
  const bestNumber = useBestNumber()
  const ids = farms.map((farm) => ({
    rewardCurrency: farm.globalFarm.rewardCurrency.toString(),
    incentivizedAsset: farm.globalFarm.incentivizedAsset.toString(),
  }))
  const oraclePrices = useOraclePrices(ids)

  return useQueryReduce([bestNumber] as const, (bestNumber) => {
    return farms.map((farm) => {
      const rewardCurrency = farm.globalFarm.rewardCurrency.toString()
      const incentivizedAsset = farm.globalFarm.incentivizedAsset.toString()
      const oraclePrice = oraclePrices.find(
        (oraclePrice) =>
          oraclePrice.data?.id.incentivizedAsset === incentivizedAsset &&
          oraclePrice.data?.id.rewardCurrency === rewardCurrency,
      )
      return getFarmApr(
        bestNumber,
        farm,
        oraclePrice?.data?.oraclePrice ?? BN_0,
      )
    })
  })
}

export const useOraclePrices = (
  assets: Array<{
    rewardCurrency: string | undefined
    incentivizedAsset: string | undefined
  }>,
) => {
  const { api } = useRpcProvider()
  return useQueries({
    queries: assets.map(({ rewardCurrency, incentivizedAsset }) => ({
      queryKey: QUERY_KEYS.oraclePrice(rewardCurrency, incentivizedAsset),
      queryFn:
        rewardCurrency != null && incentivizedAsset != null
          ? getOraclePrice(api, rewardCurrency, incentivizedAsset)
          : undefinedNoop,
      enabled: rewardCurrency != null && incentivizedAsset != null,
    })),
  })
}

export const useOraclePrice = (
  rewardCurrency: string | undefined,
  incentivizedAsset: string | undefined,
) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.oraclePrice(rewardCurrency, incentivizedAsset),
    rewardCurrency != null && incentivizedAsset != null
      ? getOraclePrice(api, rewardCurrency, incentivizedAsset)
      : undefinedNoop,
    { enabled: rewardCurrency != null && incentivizedAsset != null },
  )
}

const getOraclePrice =
  (api: ApiPromise, rewardCurrency: string, incentivizedAsset: string) =>
  async () => {
    const orderedAssets = [rewardCurrency, incentivizedAsset].sort() as [
      string,
      string,
    ]
    const res = await api.query.emaOracle.oracles(
      "omnipool",
      orderedAssets,
      "TenMinutes",
    )

    if (res.isNone)
      return {
        id: { rewardCurrency, incentivizedAsset },
        oraclePrice: BN_0,
        isNone: true,
      }

    const [data] = res.unwrap()
    const n = data.price.n.toString()
    const d = data.price.d.toString()

    let oraclePrice
    if (Number(rewardCurrency) < Number(incentivizedAsset)) {
      oraclePrice = fixed_from_rational(n, d)
    } else {
      oraclePrice = fixed_from_rational(d, n)
    }

    return {
      id: { rewardCurrency, incentivizedAsset },
      oraclePrice: BN(oraclePrice),
      isNone: false,
    }
  }

export const getMinAndMaxAPR = (farms: FarmAprs) => {
  const aprs = farms.data ? farms.data.map(({ apr }) => apr) : [BN_0]
  const minAprs = farms.data
    ? farms.data.map(({ minApr, apr }) => (minApr ? minApr : apr))
    : [BN_0]

  const minApr = BigNumber.minimum(...minAprs)
  const maxApr = aprs.reduce((acc, apr) => acc.plus(apr), BN_0)

  return {
    minApr,
    maxApr,
  }
}

export interface FarmIds {
  poolId: u32
  globalFarmId: u32
  yieldFarmId: u32
}

export const useFarmsPoolAssets = () => {
  const indexerUrl = useIndexerUrl()
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.yieldFarmCreated, async () => {
    const { events } = await getYieldFarmCreated(indexerUrl)()
    const currentBlockNumber = await api.derive.chain.bestNumber()
    const blockNumberDiff = currentBlockNumber
      .toBigNumber()
      .minus(NEW_YIELD_FARMS_BLOCKS)

    const newFarmsByPoolAsset = events.reduce<Array<number>>((acc, event) => {
      if (
        blockNumberDiff.lt(event.block.height) &&
        !acc.includes(event.args.assetId)
      )
        acc.push(event.args.assetId)

      return acc
    }, [])

    return newFarmsByPoolAsset
  })
}

export const getYieldFarmCreated = (indexerUrl: string) => async () => {
  return {
    ...(await request<{
      events: Array<{
        args: { assetId: number; globalFarmId: number; yieldFamId: number }
        block: { height: number }
      }>
    }>(
      indexerUrl,
      gql`
        query YieldFarmCreated {
          events(
            where: { name_eq: "OmnipoolLiquidityMining.YieldFarmCreated" }
          ) {
            args
            block {
              height
            }
          }
        }
      `,
    )),
  }
}

export const useInactiveYieldFarms = (poolIds: (AccountId32 | string)[]) => {
  const { api } = useRpcProvider()
  return useQueries({
    queries: poolIds.map((poolId) => ({
      queryKey: QUERY_KEYS.inactiveYieldFarms(poolId),
      queryFn: getInctiveYieldFarms(api, poolId),
    })),
  })
}

export const useInactiveFarms = (poolIds: Array<AccountId32 | string>) => {
  const activeYieldFarms = useInactiveYieldFarms(poolIds)

  const data = activeYieldFarms.reduce<
    {
      poolId: string
      globalFarmId: u32
      yieldFarmId: u32
    }[]
  >((acc, farm) => (farm.data ? [...acc, ...farm.data] : acc), [])

  const globalFarms = useGlobalFarms(
    data.map((id) => ({ globalFarmId: id.globalFarmId })),
  )
  const yieldFarms = useYieldFarms(data)

  return useQueryReduce(
    [globalFarms, yieldFarms, ...activeYieldFarms] as const,
    (globalFarms, yieldFarms, ...activeYieldFarms) => {
      const farms =
        activeYieldFarms.flat(2).map((af) => {
          const globalFarm = globalFarms?.find((gf) =>
            af.globalFarmId.eq(gf.id),
          )
          const yieldFarm = yieldFarms?.find((yf) => af.yieldFarmId.eq(yf.id))
          if (!globalFarm || !yieldFarm) return undefined
          return { globalFarm, yieldFarm }
        }) ?? []

      return farms.filter(isNotNil)
    },
  )
}

const getInctiveYieldFarms =
  (api: ApiPromise, poolId: AccountId32 | string) => async () => {
    const allGlobalFarms =
      await api.query.omnipoolWarehouseLM.globalFarm.entries()

    allGlobalFarms.map((globalFarm) => globalFarm[0].keys)

    const globalFarmsIds = allGlobalFarms.map(([key]) => {
      const [id] = key.args
      return id.toString()
    })

    const globalFarms = await Promise.all(
      globalFarmsIds.map((globalFarmId) =>
        api.query.omnipoolWarehouseLM.yieldFarm.entries(poolId, globalFarmId),
      ),
    )

    const stoppedFarms = globalFarms.reduce<
      {
        poolId: string
        globalFarmId: u32
        yieldFarmId: u32
      }[]
    >((acc, [globalFarm]) => {
      if (globalFarm) {
        const yieldFarm = globalFarm[1].unwrap()

        const isStopped = yieldFarm.state.isStopped

        if (isStopped)
          acc.push({
            poolId: globalFarm[0].args[0].toString(),
            globalFarmId: globalFarm[0].args[1],
            yieldFarmId: yieldFarm.id,
          })
      }

      return acc
    }, [])

    return stoppedFarms
  }
