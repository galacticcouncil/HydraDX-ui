import { ApiPromise } from "@polkadot/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import BN from "bignumber.js"
import { getReferendumInfoOf } from "./democracy"
import request, { gql } from "graphql-request"
import { useActiveProvider } from "./provider"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { undefinedNoop } from "utils/helpers"

interface ISubscanData {
  code: number
  message: string
  generated_at: number
  data: {
    token: Array<string>
    detail: {
      [key: string]: {
        symbol: string
        unique_id: string
        display_name: string
        asset_type: string
        token_decimals: number
        price: string
        price_change: string
        total_issuance: string
        free_balance: string
        available_balance: string
        locked_balance: string
        reserved_balance: string
        validator_bonded: string
        nominator_bonded: string
        bonded_locked_balance: string
        unbonded_locked_balance: string
        democracy_locked_balance: string
        election_locked_balance: string
        vesting_balance: string
        inflation: string
      }
    }
  }
}

export type TStakingPosition = Awaited<
  ReturnType<ReturnType<typeof getStakingPosition>>
>

export const useCirculatingSupply = () => {
  return useQuery(
    QUERY_KEYS.circulatingSupply,
    async () => {
      const res = await getCirculatingSupply()()

      return res.data.detail["HDX"].available_balance
    },
    { retry: 0 },
  )
}

const getCirculatingSupply = () => async () => {
  const res = await fetch("https://hydration.api.subscan.io/api/scan/token")

  const data: Promise<ISubscanData> = res.json()

  return data
}

const getUniques = async (
  api: ApiPromise,
  address?: string,
  collectionId?: string,
) => {
  const res = await api.query.uniques.account.entries(address, collectionId)
  const data = res.map(([key]) => {
    const [address, collectionId, itemId] = key.args
    return { address, collectionId, itemId }
  })

  return data
}

export const useStake = (address: string | undefined) => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.stake(address), getStake(api, address))
}

const getStake = (api: ApiPromise, address: string | undefined) => async () => {
  const collectionId = await api.consts.staking.nftCollectionId

  const [staking, minStake, uniques] = await Promise.all([
    api.query.staking.staking(),
    api.consts.staking.minStake,
    getUniques(api, address, collectionId.toString()),
  ])

  const stakePositionId = uniques.find((nfts) => nfts)?.itemId.toNumber()

  return {
    totalStake: staking?.totalStake?.toBigNumber() as BN,
    accumulatedRewardPerStake:
      staking?.accumulatedRewardPerStake?.toBigNumber() as BN,
    potReservedBalance: staking?.potReservedBalance?.toBigNumber() as BN,
    minStake: minStake.toBigNumber() as BN,
    positionId: stakePositionId,
    stakePosition: stakePositionId
      ? await getStakingPosition(api, stakePositionId)()
      : undefined,
  }
}

const getStakingPosition = (api: ApiPromise, id: number) => async () => {
  const [position, votesRes] = await Promise.all([
    api.query.staking.positions(id),
    api.query.staking.positionVotes(id),
  ])
  const positionData = position.unwrap()

  const createdAt: BN = positionData.createdAt.toBigNumber()

  const votes: Array<{
    id: BN
    amount: BN
    conviction: string
  }> = await votesRes.votes.reduce(async (acc, [key, data]) => {
    const prevAcc = await acc
    const id = key.toBigNumber()
    const amount = data.amount.toBigNumber()
    const conviction = data.conviction.toString()

    const referendaInfo = await getReferendumInfoOf(api, id.toString())
    const isFinished = referendaInfo.isNone
      ? true
      : referendaInfo.unwrap().isFinished

    if (isFinished) {
      prevAcc.push({
        id,
        amount,
        conviction,
      })
    }

    return prevAcc
  }, Promise.resolve<Array<{ id: BN; amount: BN; conviction: string }>>([]))

  return {
    stake: positionData.stake.toBigNumber() as BN,
    rewardPerStake: positionData.rewardPerStake.toBigNumber() as BN,
    createdAt,
    actionPoints: positionData.actionPoints.toBigNumber() as BN,
    accumulatedUnpaidRewards:
      positionData.accumulatedUnpaidRewards.toBigNumber() as BN,
    accumulatedSlashPoints:
      positionData.accumulatedSlashPoints.toBigNumber() as BN,
    accumulatedLockedRewards:
      positionData.accumulatedLockedRewards.toBigNumber() as BN,
    votes: votes,
  }
}

export const useStakingConsts = () => {
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.stakingConsts, getStakingConsts(api))
}

const getStakingConsts = (api: ApiPromise) => async () => {
  const [
    palletId,
    periodLength,
    unclaimablePeriods,
    timePointsPerPeriod,
    timePointsWeight,
    actionPointsWeight,
  ] = await Promise.all([
    api.consts.staking.palletId,
    api.consts.staking.periodLength,
    api.consts.staking.unclaimablePeriods,
    api.consts.staking.timePointsPerPeriod,
    api.consts.staking.timePointsWeight,
    api.consts.staking.actionPointsWeight,
  ])

  return {
    palletId: palletId.toHuman() as string,
    periodLength: periodLength.toBigNumber(),
    unclaimablePeriods: unclaimablePeriods.toBigNumber(),
    timePointsPerPeriod: timePointsPerPeriod.toBigNumber(),
    timePointsWeight: timePointsWeight.toBigNumber().div(1000000),
    actionPointsWeight: actionPointsWeight.toBigNumber().div(1000000000),
  }
}

type StakeEventBase = {
  block: {
    height: string
  }
}

type TStakingInitialized = StakeEventBase & {
  name: "Staking.StakingInitialized"
}

type TPositionBalance = StakeEventBase &
  (
    | {
        name: "Staking.PositionCreated"
        args: {
          positionId: string
          stake: string
          who: string
        }
      }
    | {
        name: "Staking.StakeAdded"
        args: {
          lockedRewards: string
          positionId: string
          slashedPoints: string
          stake: string
          totalStake: string
          who: string
        }
      }
  )

export type TAccumulatedRpsUpdated = StakeEventBase & {
  name: "Staking.AccumulatedRpsUpdated"
  args: {
    accumulatedRps: string
    totalStake: string
  }
}

export const useStakingEvents = () => {
  const { indexerUrl } = useActiveProvider()

  return useQuery(QUERY_KEYS.stakingEvents, async () => {
    const [accumulatedRpsUpdated, stakingInitialized] = await Promise.all([
      getAccumulatedRpsUpdatedEvents(indexerUrl)(),
      getStakingInitializedEvents(indexerUrl)(),
    ])

    return {
      accumulatedRpsUpdated,
      stakingInitialized: stakingInitialized.events.length
        ? stakingInitialized.events[0]
        : undefined,
    }
  })
}

export const useStakingPositionBalances = (positionId?: string) => {
  const { indexerUrl } = useActiveProvider()

  return useQuery(
    QUERY_KEYS.stakingPositionBalances(positionId),
    positionId
      ? getStakingPositionBalances(indexerUrl, positionId)
      : undefinedNoop,
    { enabled: !!positionId },
  )
}

const getAccumulatedRpsUpdatedEvents = (indexerUrl: string) => async () => {
  return {
    ...(await request<{
      events: Array<TAccumulatedRpsUpdated>
    }>(
      indexerUrl,
      gql`
        query AccumulatedRpsUpdatedEvents {
          events(
            where: { name_eq: "Staking.AccumulatedRpsUpdated" }
            orderBy: [block_height_ASC]
          ) {
            args
            block {
              height
            }
            name
          }
        }
      `,
    )),
  }
}

const getStakingInitializedEvents = (indexerUrl: string) => async () => {
  return {
    ...(await request<{
      events: Array<TStakingInitialized>
    }>(
      indexerUrl,
      gql`
        query StakingInitializedEvents {
          events(where: { name_eq: "Staking.StakingInitialized" }) {
            block {
              height
            }
            name
          }
        }
      `,
    )),
  }
}

const getStakingPositionBalances =
  (indexerUrl: string, positionId: string) => async () => {
    return {
      ...(await request<{
        events: Array<TPositionBalance>
      }>(
        indexerUrl,
        gql`
          query StakingPositionBalances($positionId: String!) {
            events(
              where: {
                name_contains: "Staking"
                args_jsonContains: { positionId: $positionId }
              }
              orderBy: [block_height_ASC]
            ) {
              name
              block {
                height
              }
              args
            }
          }
        `,
        { positionId },
      )),
    }
  }

export const useProcessedVotesIds = () => {
  const { account } = useAccount()
  const { api } = useRpcProvider()

  return useMutation(async () => {
    if (!account) {
      return []
    }

    const processedVotesRes = await api.query.staking.processedVotes.entries(
      account.address,
    )

    const ids = processedVotesRes.map(([processedVote]) => {
      const [, id] = processedVote.toHuman() as string[]

      return id
    })

    return ids
  })
}

export const usePositionVotesIds = () => {
  const { api } = useRpcProvider()

  return useMutation(async (positionId: number) => {
    const positionVotesRes = await api.query.staking.positionVotes(positionId)
    const positionVotesIds = positionVotesRes.votes.map(([position]) =>
      position.toString(),
    )

    return positionVotesIds
  })
}
