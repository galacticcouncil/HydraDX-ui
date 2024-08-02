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
import { BLOCK_TIME, BN_0, BN_1, PARACHAIN_BLOCK_TIME } from "utils/constants"
import { undefinedNoop, useQueryReduce } from "utils/helpers"
import { QUERY_KEYS } from "utils/queryKeys"
import { useBestNumber } from "./chain"
import { fixed_from_rational } from "@galacticcouncil/math-liquidity-mining"
import BN from "bignumber.js"
import { useRpcProvider } from "providers/rpcProvider"
import { useIndexerUrl } from "./provider"
import request, { gql } from "graphql-request"
import { AccountId32 } from "@polkadot/types/interfaces"
import { useMemo } from "react"
import { scale } from "utils/balance"
import { getAccountResolver } from "utils/farms/claiming/accountResolver"
import { useAccountBalances, useAccountsBalances } from "./accountBalances"
import { useAssets } from "providers/assets"

const NEW_YIELD_FARMS_BLOCKS = (48 * 60 * 60) / PARACHAIN_BLOCK_TIME.toNumber() // 48 hours

type FarmIds = {
  poolId: string
  globalFarmId: string
  yieldFarmId: string
}

type FarmAprs = ReturnType<typeof useFarmAprs>

export interface Farm {
  globalFarm: PalletLiquidityMiningGlobalFarmData
  yieldFarm: PalletLiquidityMiningYieldFarmData
  globalFarmPotAddress: string
  poolId: string
}

export function useActiveYieldFarms(poolIds: Array<string>) {
  const { api } = useRpcProvider()
  const { getAssetWithFallback, isShareToken } = useAssets()

  return useQueries({
    queries: poolIds.map((poolId) => {
      const meta = getAssetWithFallback(poolId)
      const isXYK = isShareToken(meta)

      return {
        queryKey: isXYK
          ? QUERY_KEYS.activeYieldFarmsXYK(poolId)
          : QUERY_KEYS.activeYieldFarms(poolId),
        queryFn: getActiveYieldFarms(
          api,
          poolId,
          isXYK ? meta.poolAddress : undefined,
        ),
        enabled: poolId != null,
      }
    }),
  })
}
const getActiveYieldFarms =
  (api: ApiPromise, poolId: string, poolAddress: string | undefined) =>
  async () => {
    const res = poolAddress
      ? await api.query.xykWarehouseLM.activeYieldFarm.entries(poolAddress)
      : await api.query.omnipoolWarehouseLM.activeYieldFarm.entries(poolId)

    return res.map(([storageKey, codec]) => {
      const [, globalFarmId] = storageKey.args
      const yieldFarmId = codec.unwrap()
      return {
        poolId,
        globalFarmId: globalFarmId.toString(),
        yieldFarmId: yieldFarmId.toString(),
      }
    })
  }

export function useYieldFarms(ids: FarmIds[]) {
  const { api } = useRpcProvider()
  const { getAssetWithFallback, isShareToken } = useAssets()

  return useQueries({
    queries: ids.map(({ poolId, globalFarmId, yieldFarmId }) => {
      const meta = getAssetWithFallback(poolId)
      const isXYK = isShareToken(meta)

      return {
        queryKey: isXYK
          ? QUERY_KEYS.yieldFarmXYK(yieldFarmId)
          : QUERY_KEYS.yieldFarm(yieldFarmId),
        queryFn: async () => {
          const farm = await getYieldFarm(
            api,
            isXYK ? meta.poolAddress : poolId,
            globalFarmId,
            yieldFarmId,
            isXYK,
          )()
          return { farm, poolId }
        },
        enabled: poolId != null,
      }
    }),
  })
}

const getYieldFarm =
  (
    api: ApiPromise,
    poolId: string,
    globalFarmId: string,
    yieldFarmId: string,
    isXYK: boolean,
  ) =>
  async () => {
    const yieldFarm = isXYK
      ? await api.query.xykWarehouseLM.yieldFarm(
          poolId,
          globalFarmId,
          yieldFarmId,
        )
      : await api.query.omnipoolWarehouseLM.yieldFarm(
          poolId,
          globalFarmId,
          yieldFarmId,
        )

    return yieldFarm.unwrap()
  }

export function useGlobalFarms(ids: FarmIds[]) {
  const { api } = useRpcProvider()
  const { getAssetWithFallback, isShareToken } = useAssets()

  return useQueries({
    queries: ids.map(({ poolId, globalFarmId }) => {
      const meta = getAssetWithFallback(poolId)
      const isXYK = isShareToken(meta)

      return {
        queryKey: isXYK
          ? QUERY_KEYS.globalFarmXYK(globalFarmId, poolId)
          : QUERY_KEYS.globalFarm(globalFarmId, poolId),
        queryFn: async () => {
          const farm = await getGlobalFarm(api, globalFarmId, isXYK)()
          return { farm, poolId }
        },
        enabled: poolId != null,
      }
    }),
  })
}

const getGlobalFarm =
  (api: ApiPromise, id: string, isXYK: boolean) => async () => {
    const globalFarm = isXYK
      ? await api.query.xykWarehouseLM.globalFarm(id)
      : await api.query.omnipoolWarehouseLM.globalFarm(id)

    return globalFarm.unwrap()
  }

export const useFarms = (poolIds: Array<string>) => {
  const { api } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()
  const activeYieldFarmsQuery = useActiveYieldFarms(poolIds)

  const farmIds = activeYieldFarmsQuery
    .reduce<Array<Array<FarmIds>>>((acc, farm) => {
      if (farm.data) acc.push(farm.data)
      return acc
    }, [])
    .flat(2)

  const accountResolver = getAccountResolver(api.registry)
  const globalFarmPotAddresses = farmIds?.map((farm) => {
    const isXyk = getAssetWithFallback(farm.poolId).isShareToken
    const potAddresss = accountResolver(
      Number(farm.globalFarmId),
      isXyk,
    ).toString()

    return {
      globalFarmId: farm.globalFarmId.toString(),
      potAddresss,
    }
  })

  const globalFarms = useGlobalFarms(farmIds)
  const yieldFarms = useYieldFarms(farmIds)

  const queries = [globalFarms, yieldFarms]

  const isLoading = queries.some((querie) =>
    querie.some((q) => q.isInitialLoading),
  )

  const data = useMemo(() => {
    return farmIds
      .map((farmId) => {
        const globalFarm = globalFarms.find((globalFarm) => {
          const data = globalFarm.data

          return (
            data?.farm.id.toString() === farmId.globalFarmId &&
            data.poolId === farmId.poolId
          )
        })?.data?.farm

        const globalFarmPotAddress = globalFarmPotAddresses.find(
          (farm) => farm.globalFarmId === globalFarm?.id.toString(),
        )?.potAddresss

        const yieldFarm = yieldFarms.find((yieldFarm) => {
          const data = yieldFarm.data

          return (
            data?.farm.id.toString() === farmId.yieldFarmId &&
            data.poolId === farmId.poolId
          )
        })?.data?.farm

        if (!globalFarm || !yieldFarm) return undefined

        return {
          globalFarm,
          yieldFarm,
          globalFarmPotAddress,
          poolId: farmId.poolId,
        }
      })
      .filter((x): x is Farm => x != null)
  }, [farmIds, globalFarms, yieldFarms, globalFarmPotAddresses])

  return { data, isLoading }
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
  potBalance?: BigNumber,
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
    apr = yieldPerPeriod.times(multiplier).times(periodsPerYear).shiftedBy(-18)
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
  const potMaxRewards = potBalance
    ? distributedRewards.plus(potBalance)
    : maxRewards

  const leftToDistribute = potMaxRewards.minus(distributedRewards)

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
    potMaxRewards,
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

export const useFarmApr = (farm: Farm) => {
  const { native } = useAssets()
  const bestNumber = useBestNumber()
  const rewardCurrency = farm.globalFarm.rewardCurrency.toString()
  const incentivizedAsset = farm.globalFarm.incentivizedAsset.toString()

  const accountBalance = useAccountBalances(farm.globalFarmPotAddress)
  const oraclePrice = useOraclePrice(rewardCurrency, incentivizedAsset)

  return useQueryReduce(
    [bestNumber, oraclePrice] as const,
    (bestNumber, oraclePrice) => {
      const rewardCurrency = farm.globalFarm.rewardCurrency.toString()
      const potBalance =
        rewardCurrency === native.id
          ? accountBalance.data?.native.freeBalance
          : accountBalance.data?.balances.find(
              (balance) => balance.id.toString() === rewardCurrency,
            )?.freeBalance

      return getFarmApr(
        bestNumber,
        farm,
        oraclePrice?.oraclePrice ??
          farm.globalFarm.priceAdjustment.toBigNumber(),
        potBalance,
      )
    },
  )
}

export const useFarmAprs = (farms: Farm[]) => {
  const { native } = useAssets()
  const bestNumber = useBestNumber()
  const ids = farms.map((farm) => ({
    rewardCurrency: farm.globalFarm.rewardCurrency.toString(),
    incentivizedAsset: farm.globalFarm.incentivizedAsset.toString(),
  }))
  const oraclePrices = useOraclePrices(ids)
  const accountsBalances = useAccountsBalances(
    farms.map((farm) => farm.globalFarmPotAddress),
  )

  return useQueryReduce([bestNumber] as const, (bestNumber) => {
    return farms.map((farm) => {
      const rewardCurrency = farm.globalFarm.rewardCurrency.toString()
      const incentivizedAsset = farm.globalFarm.incentivizedAsset.toString()
      const oraclePrice = oraclePrices.find(
        (oraclePrice) =>
          oraclePrice.data?.id.incentivizedAsset === incentivizedAsset &&
          oraclePrice.data?.id.rewardCurrency === rewardCurrency,
      )
      const accountBalance = accountsBalances.data?.find(
        (balance) => balance.accountId.toString() === farm.globalFarmPotAddress,
      )

      const potBalance = accountBalance
        ? rewardCurrency === native.id
          ? accountBalance.native.freeBalance
          : accountBalance.balances.find(
              (balance) => balance.id.toString() === rewardCurrency,
            )?.freeBalance
        : undefined

      return getFarmApr(
        bestNumber,
        farm,
        oraclePrice?.data?.oraclePrice ??
          farm.globalFarm.priceAdjustment.toBigNumber(),
        potBalance,
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

    if (rewardCurrency === incentivizedAsset)
      return {
        id: { rewardCurrency, incentivizedAsset },
        oraclePrice: scale(BN_1, "q"),
      }
    const res = await api.query.emaOracle.oracles(
      "omnipool",
      orderedAssets,
      "TenMinutes",
    )

    if (res.isNone)
      return {
        id: { rewardCurrency, incentivizedAsset },
        oraclePrice: undefined,
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
      price: { n, d },
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

  const farmIds = activeYieldFarms.reduce<FarmIds[]>(
    (acc, farm) => (farm.data ? [...acc, ...farm.data] : acc),
    [],
  )

  const globalFarms = useGlobalFarms(farmIds)
  const yieldFarms = useYieldFarms(farmIds)

  const queries = [globalFarms, yieldFarms]

  const isLoading = queries.some((querie) =>
    querie.some((q) => q.isInitialLoading),
  )

  const data = useMemo(() => {
    return farmIds
      .map((farmId) => {
        const globalFarm = globalFarms.find((globalFarm) => {
          const data = globalFarm.data

          return (
            data?.farm.id.toString() === farmId.globalFarmId &&
            data.poolId === farmId.poolId
          )
        })?.data?.farm

        const yieldFarm = yieldFarms.find((yieldFarm) => {
          const data = yieldFarm.data

          return (
            data?.farm.id.toString() === farmId.yieldFarmId &&
            data.poolId === farmId.poolId
          )
        })?.data?.farm

        if (!globalFarm || !yieldFarm) return undefined

        return { globalFarm, yieldFarm, poolId: farmId.poolId }
      })
      .filter((x): x is Farm => x != null)
  }, [farmIds, globalFarms, yieldFarms])

  return { data, isLoading }
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

    const stoppedFarms = globalFarms.reduce<FarmIds[]>((acc, [globalFarm]) => {
      if (globalFarm) {
        const yieldFarm = globalFarm[1].unwrap()

        const isStopped = yieldFarm.state.isStopped

        if (isStopped)
          acc.push({
            poolId: globalFarm[0].args[0].toString(),
            globalFarmId: globalFarm[0].args[1].toString(),
            yieldFarmId: yieldFarm.id.toString(),
          })
      }

      return acc
    }, [])

    return stoppedFarms
  }
