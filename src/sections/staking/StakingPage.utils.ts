import { useBestNumber } from "api/chain"
import BN, { BigNumber } from "bignumber.js"
import * as wasm from "@galacticcouncil/math-staking"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import {
  TAccumulatedRpsUpdated,
  TStakingPosition,
  useCirculatingSupply,
  useStake,
  useStakingConsts,
  useStakingEvents,
  useStakingPositionBalances,
} from "api/staking"
import { useTokenBalance, useTokenLocks } from "api/balances"
import { getHydraAccountAddress } from "utils/api"
import { useDisplayPrice } from "utils/displayAsset"
import { BN_0, BN_100, BN_BILL, BN_QUINTILL } from "utils/constants"
import { useMemo } from "react"
import { useReferendums } from "api/democracy"
import { useAssets } from "providers/assets"

const CONVICTIONS: { [key: string]: number } = {
  none: 0.1,
  locked1x: 1,
  locked2x: 2,
  locked3x: 3,
  locked4x: 4,
  locked5x: 5,
  locked6x: 6,
}

const lengthOfStaking = BN(50400) // min. amount of block for how long we want to calculate APR from = one week
const blocksPerYear = 2628000

export type TStakingData = NonNullable<ReturnType<typeof useStakeData>["data"]>

const getCurrentActionPoints = (
  votes: TStakingPosition["votes"],
  initialActionPoints: number,
  stakePosition: BN,
) => {
  let currentActionPoints = 0

  const maxVotingPower = stakePosition.multipliedBy(CONVICTIONS["locked6x"])
  const maxActionPointsPerRef = 100

  votes?.forEach((vote) => {
    const convictionIndex = CONVICTIONS[vote.conviction.toLowerCase()]

    currentActionPoints += Math.floor(
      vote.amount
        .multipliedBy(convictionIndex)
        .multipliedBy(maxActionPointsPerRef)
        .div(maxVotingPower)
        .toNumber(),
    )
  })

  const actionMultipliers = {
    democracyVote: 1,
  }

  currentActionPoints *= actionMultipliers.democracyVote
  currentActionPoints += initialActionPoints ?? 0

  return BN(currentActionPoints)
}

export const useStakeData = () => {
  const { native } = useAssets()

  const { account } = useAccount()
  const stake = useStake(account?.address)
  const circulatingSupply = useCirculatingSupply()
  const balance = useTokenBalance(native.id, account?.address)
  const locks = useTokenLocks(native.id)
  const spotPrice = useDisplayPrice(native.id)
  const positionBalances = useStakingPositionBalances(
    stake.data?.positionId?.toString(),
  )
  const referendas = useReferendums("finished")

  const vestLocks = locks.data?.reduce(
    (acc, lock) => (lock.type === "ormlvest" ? acc.plus(lock.amount) : acc),
    BN_0,
  )

  const vested = vestLocks ?? BN_0
  const staked = stake.data?.stakePosition?.stake ?? BN_0
  const accumulatedLockedRewards =
    stake.data?.stakePosition?.accumulatedLockedRewards ?? BN_0

  const rawAvailableBalance = balance.data?.freeBalance
    .minus(vested)
    .minus(staked)
    .minus(accumulatedLockedRewards)

  const availableBalance = BigNumber.max(0, rawAvailableBalance ?? BN_0)

  const queries = [
    stake,
    circulatingSupply,
    balance,
    locks,
    spotPrice,
    positionBalances,
    referendas,
  ]

  const isLoading = queries.some((query) => query.isInitialLoading)

  const data = useMemo(() => {
    if (isLoading) return undefined

    const availableBalanceDollar = availableBalance
      ?.multipliedBy(spotPrice.data?.spotPrice ?? 1)
      .shiftedBy(-native.decimals)

    const totalStake = stake.data?.totalStake ?? 0

    const supplyStaked = BN(totalStake)
      .div(Number(circulatingSupply.data ?? 1))
      .decimalPlaces(4)
      .multipliedBy(100)

    const stakeDollar = stake.data?.stakePosition?.stake
      .multipliedBy(spotPrice.data?.spotPrice ?? 1)
      .shiftedBy(-native.decimals)

    const circulatingSupplyData = BN(circulatingSupply.data ?? 0).shiftedBy(
      -native.decimals,
    )

    const stakePosition = stake.data?.stakePosition
    let averagePercentage = BN_0
    let amountOfReferends = 0

    if (stakePosition) {
      const initialPositionBalance = BN(
        positionBalances.data?.events.find(
          (event) => event.name === "Staking.PositionCreated",
        )?.args.stake ?? 0,
      )

      const allReferendaPercentages =
        referendas.data?.reduce((acc, referenda) => {
          const endReferendaBlockNumber =
            referenda.referendum.asFinished.end.toBigNumber()

          if (endReferendaBlockNumber.gt(stakePosition.createdAt)) {
            amountOfReferends++

            if (referenda.amount && referenda.conviction) {
              /* staked position value when a referenda is over */
              let positionBalance = initialPositionBalance

              positionBalances.data?.events.forEach((event) => {
                if (event.name === "Staking.StakeAdded") {
                  const eventOccurBlockNumber = BN(event.block.height)

                  if (
                    endReferendaBlockNumber.gte(eventOccurBlockNumber) &&
                    positionBalance.lt(event.args.totalStake)
                  ) {
                    positionBalance = BN(event.args.totalStake)
                  }
                }
              })

              const percentageOfVotedReferenda = referenda.amount
                .div(positionBalance)
                .multipliedBy(CONVICTIONS[referenda.conviction.toLowerCase()])
                .div(CONVICTIONS["locked6x"])
                .multipliedBy(100)

              return acc.plus(percentageOfVotedReferenda)
            }
          }

          return acc
        }, BN_0) ?? BN(0)

      averagePercentage =
        allReferendaPercentages.isZero() && !amountOfReferends
          ? BN_100
          : allReferendaPercentages.div(amountOfReferends)
    }

    const rewardBoostPersentage = referendas.data?.length
      ? averagePercentage
      : BN_100

    return {
      supplyStaked,
      availableBalance,
      availableBalanceDollar,
      circulatingSupply: circulatingSupplyData,
      positionId: stake.data?.positionId,
      stakeDollar,
      minStake: stake.data?.minStake,
      stakePosition: stakePosition
        ? {
            ...stake.data?.stakePosition,
            rewardBoostPersentage,
          }
        : undefined,
    }
  }, [
    availableBalance,
    circulatingSupply.data,
    isLoading,
    positionBalances.data?.events,
    referendas.data,
    spotPrice.data?.spotPrice,
    stake.data?.minStake,
    stake.data?.positionId,
    stake.data?.stakePosition,
    stake.data?.totalStake,
    native,
  ])

  return {
    data,
    isLoading,
  }
}

export const useStakeARP = (availableUserBalance: BN | undefined) => {
  const { native } = useAssets()
  const { account } = useAccount()
  const bestNumber = useBestNumber()
  const stake = useStake(account?.address)
  const stakingEvents = useStakingEvents()
  const stakingConsts = useStakingConsts()
  const potAddress = getHydraAccountAddress(stakingConsts.data?.palletId)
  const potBalance = useTokenBalance(native.id, potAddress)

  const queries = [bestNumber, stake, stakingConsts, potBalance, stakingEvents]

  const isLoading = queries.some((query) => query.isLoading)

  const data = useMemo(() => {
    if (
      !stake.data ||
      !stakingConsts.data ||
      !bestNumber.data ||
      !potBalance.data ||
      !stakingEvents.data
    )
      return undefined

    const {
      potReservedBalance,
      accumulatedRewardPerStake,
      totalStake,
      positionId,
    } = stake.data

    const hasPosition = positionId

    const currentBlockNumber =
      bestNumber.data.parachainBlockNumber.toBigNumber()

    const pendingRewards = potBalance.data.balance.minus(potReservedBalance)

    const { accumulatedRpsUpdated, stakingInitialized } = stakingEvents.data

    const {
      filteredAccumulatedRpsUpdatedBefore,
      filteredAccumulatedRpsUpdatedAfter,
    } = accumulatedRpsUpdated.events.reduce(
      (acc, event) => {
        const isBeforeStaking = currentBlockNumber
          .minus(lengthOfStaking)
          .gt(event.block.height)
        acc[
          isBeforeStaking
            ? "filteredAccumulatedRpsUpdatedBefore"
            : "filteredAccumulatedRpsUpdatedAfter"
        ].push(event)

        return acc
      },
      {
        filteredAccumulatedRpsUpdatedBefore: [] as TAccumulatedRpsUpdated[],
        filteredAccumulatedRpsUpdatedAfter: [] as TAccumulatedRpsUpdated[],
      },
    )

    if (hasPosition) {
      let rpsNow = BN_0
      let deltaRps = BN_0
      let deltaBlocks = BN_0

      if (pendingRewards.isZero()) {
        rpsNow = accumulatedRewardPerStake
      } else {
        rpsNow = BN(
          wasm.calculate_accumulated_rps(
            accumulatedRewardPerStake.toString(),
            pendingRewards.toString(),
            totalStake.toString(),
          ),
        )
      }

      if (filteredAccumulatedRpsUpdatedBefore?.length) {
        const lastAccumulatedRpsUpdated =
          filteredAccumulatedRpsUpdatedBefore[
            filteredAccumulatedRpsUpdatedBefore.length - 1
          ] // the newest event

        deltaRps = rpsNow.minus(lastAccumulatedRpsUpdated.args.accumulatedRps)
        deltaBlocks = currentBlockNumber.minus(
          lastAccumulatedRpsUpdated.block.height,
        )
      } else if (stakingInitialized) {
        const blockNumber = stakingInitialized.block.height
        deltaRps = rpsNow
        deltaBlocks = currentBlockNumber.minus(blockNumber)
      }

      const rpsAvg = deltaRps.dividedBy(deltaBlocks) // per block

      const apr = rpsAvg
        .div(BN_QUINTILL)
        .multipliedBy(blocksPerYear)
        .multipliedBy(100)

      return { apr }
    } else {
      const totalToStake = stake.data.totalStake.plus(availableUserBalance ?? 0)
      const rpsNow = pendingRewards.div(totalToStake)
      let deltaBlocks = BN_0
      let rpsAvg = BN_0

      const lastAccumulatedRpsUpdated =
        filteredAccumulatedRpsUpdatedBefore?.[
          filteredAccumulatedRpsUpdatedBefore.length - 1
        ] // the newest event

      if (
        filteredAccumulatedRpsUpdatedAfter &&
        filteredAccumulatedRpsUpdatedAfter.length
      ) {
        let deltaRpsAdjusted = BN_0

        filteredAccumulatedRpsUpdatedAfter.forEach((event, index, events) => {
          let re = BN_0
          if (index === 0) {
            if (lastAccumulatedRpsUpdated) {
              re = BN(event.args.accumulatedRps)
                .minus(lastAccumulatedRpsUpdated.args.accumulatedRps)
                .multipliedBy(event.args.totalStake)
            } else {
              re = BN(event.args.accumulatedRps).multipliedBy(
                event.args.totalStake,
              )
            }
          } else {
            re = BN(event.args.accumulatedRps)
              .minus(events[index - 1].args.accumulatedRps)
              .multipliedBy(event.args.totalStake)
          }
          deltaRpsAdjusted = deltaRpsAdjusted.plus(
            re.div(BN(event.args.totalStake).plus(availableUserBalance ?? 0)),
          )
        })

        deltaRpsAdjusted = deltaRpsAdjusted.plus(rpsNow)

        if (lastAccumulatedRpsUpdated) {
          deltaBlocks = currentBlockNumber.minus(
            lastAccumulatedRpsUpdated.block.height,
          )
        } else if (stakingInitialized) {
          deltaBlocks = currentBlockNumber.minus(
            stakingInitialized.block.height,
          )
        }

        const rpsAvg = deltaRpsAdjusted.div(deltaBlocks)

        const apr = rpsAvg
          .div(BN_QUINTILL)
          .multipliedBy(blocksPerYear)
          .multipliedBy(100)

        return { apr }
      } else if (stakingInitialized) {
        deltaBlocks = currentBlockNumber.minus(stakingInitialized.block.height)

        rpsAvg = rpsNow.div(deltaBlocks)

        const apr = rpsAvg
          .div(BN_QUINTILL)
          .multipliedBy(blocksPerYear)
          .multipliedBy(100)

        return { apr }
      }
      return { apr: BN_0 }
    }
  }, [
    availableUserBalance,
    bestNumber.data,
    potBalance.data,
    stake.data,
    stakingConsts.data,
    stakingEvents.data,
  ])

  return { data, isLoading }
}

export const useClaimReward = () => {
  /* constants that might be changed */
  const a = "20000000000000000"
  const b = "2000"

  const { native } = useAssets()
  const { account } = useAccount()
  const bestNumber = useBestNumber()
  const stake = useStake(account?.address)
  const stakingConsts = useStakingConsts()

  const potAddress = getHydraAccountAddress(stakingConsts.data?.palletId)
  const potBalance = useTokenBalance(native.id, potAddress)

  const queries = [bestNumber, stake, stakingConsts, potBalance]
  const isLoading = queries.some((query) => query.isLoading)

  const data = useMemo(() => {
    if (
      !(
        potBalance.data &&
        stake.data?.stakePosition &&
        stakingConsts.data &&
        bestNumber.data
      )
    )
      return undefined

    const {
      potReservedBalance,
      accumulatedRewardPerStake,
      totalStake,
      stakePosition,
      positionId,
    } = stake.data

    const {
      periodLength,
      unclaimablePeriods,
      timePointsPerPeriod,
      timePointsWeight,
      actionPointsWeight,
    } = stakingConsts.data

    const pendingRewards = potBalance.data.balance.minus(potReservedBalance)

    let rewardPerStake = accumulatedRewardPerStake.toString()

    if (!pendingRewards.isZero() && !totalStake.isZero()) {
      rewardPerStake = wasm.calculate_accumulated_rps(
        accumulatedRewardPerStake.toString(),
        pendingRewards.toString(),
        totalStake.toString(),
      )
    }

    const currentPeriod = wasm.calculate_period_number(
      periodLength.toString(),
      bestNumber.data.parachainBlockNumber.toString(),
    )

    const enteredAt = wasm.calculate_period_number(
      periodLength.toString(),
      stakePosition.createdAt.toString(),
    )

    if (BN(currentPeriod).minus(enteredAt).lte(unclaimablePeriods)) {
      return { rewards: BN_0, unlockedRewards: BN_0, positionId }
    }

    const maxRewards = wasm.calculate_rewards(
      rewardPerStake,
      stakePosition.rewardPerStake.toString(),
      stakePosition.stake.toString(),
    )

    const actionPoints = getCurrentActionPoints(
      stakePosition.votes,
      stakePosition.actionPoints.toNumber(),
      stakePosition.stake,
    )

    const points = wasm.calculate_points(
      enteredAt,
      currentPeriod,
      timePointsPerPeriod.toString(),
      timePointsWeight.toString(),
      actionPoints.toString(),
      actionPointsWeight.toString(),
      stakePosition.accumulatedSlashPoints.toString(),
    )

    const payablePercentage = wasm.sigmoid(points, a, b)

    const totalRewards = BN(maxRewards)
      .plus(stakePosition.accumulatedUnpaidRewards)
      .plus(stakePosition.accumulatedLockedRewards)

    const userRewards = BN(
      wasm.calculate_percentage_amount(
        totalRewards.toString(),
        payablePercentage,
      ),
    )

    const availabeRewards = BN.max(
      stakePosition.accumulatedLockedRewards,
      userRewards,
    )

    return {
      positionId,
      rewards: availabeRewards.div(BN_BILL),
      maxRewards: totalRewards.div(BN_BILL),
      actionPoints,
      allocatedRewardsPercentage: availabeRewards
        .div(totalRewards)
        .multipliedBy(100),
    }
  }, [bestNumber.data, potBalance.data, stake, stakingConsts])

  return { data, isLoading }
}
