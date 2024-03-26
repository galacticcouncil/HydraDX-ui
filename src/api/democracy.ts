import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useRpcProvider } from "providers/rpcProvider"
import { undefinedNoop } from "utils/helpers"
import BN from "bignumber.js"
import { BN_0 } from "utils/constants"

const REFERENDUM_DATA_URL = import.meta.env.VITE_REFERENDUM_DATA_URL as string

const CONVICTIONS_BLOCKS: { [key: string]: number } = {
  none: 0,
  locked1x: 50400,
  locked2x: 100800,
  locked3x: 201600,
  locked4x: 403200,
  locked5x: 806400,
  locked6x: 1612800,
}

export const useReferendums = (type?: "ongoing" | "finished") => {
  const { api, isLoaded } = useRpcProvider()
  const { account } = useAccount()

  return useQuery(
    QUERY_KEYS.referendums(account?.address, type),
    getReferendums(api, account?.address),
    {
      enabled: isLoaded,
      select: (data) =>
        type
          ? data.filter(
              (r) =>
                r.referendum[type === "ongoing" ? "isOngoing" : "isFinished"],
            )
          : data,
    },
  )
}

export const useReferendumInfo = (referendumIndex: string) => {
  return useQuery(
    QUERY_KEYS.referendumInfo(referendumIndex),
    getReferendumInfo(referendumIndex),
  )
}

export const getReferendums =
  (api: ApiPromise, accountId?: string) => async () => {
    const [referendumRaw, votesRaw] = await Promise.all([
      api.query.democracy.referendumInfoOf.entries(),
      accountId ? api.query.democracy.votingOf(accountId) : undefined,
    ])

    const isDelegating = votesRaw?.isDelegating

    const referendums = referendumRaw.map(([key, codec]) => {
      const id = key.args[0].toString()

      const vote = !isDelegating
        ? votesRaw?.asDirect.votes.find((vote) => vote[0].toString() === id)
        : undefined

      return {
        id: key.args[0].toString(),
        referendum: codec.unwrap(),
        voted: !!vote,
        amount: vote?.[1].asStandard?.balance.toBigNumber(),
        conviction: vote?.[1].asStandard?.vote.conviction.toString(),
        isDelegating,
      }
    })

    return referendums
  }

export const getReferendumInfo = (referendumIndex: string) => async () => {
  const res = await fetch(`${REFERENDUM_DATA_URL}/${referendumIndex}.json`)
  if (!res.ok) return null

  const json: Referendum = await res.json()

  if (
    json === null ||
    json.referendumIndex === null ||
    json.motionIndex === null ||
    json.title === null
  )
    return null

  return json
}

export type Referendum = {
  title: string
  state: string
  lastActivityAt: string
  referendumIndex: number
  motionIndex: number
  onchainData: {
    meta: {
      end: number
    }
  }
}

export const getReferendumInfoOf = async (api: ApiPromise, id: string) =>
  await api.query.democracy.referendumInfoOf(id)

export const useAccountVotes = () => {
  const { api, isLoaded } = useRpcProvider()
  const { account } = useAccount()

  return useQuery(
    QUERY_KEYS.referendumVotes(account?.address),
    account ? getAccountUnlockedVotes(api, account.address) : undefinedNoop,
    {
      enabled: isLoaded && !!account,
    },
  )
}

export const getAccountUnlockedVotes =
  (api: ApiPromise, accountId: string) => async () => {
    const [votesRaw, currentBlock] = await Promise.all([
      api.query.democracy.votingOf(accountId),
      api.derive.chain.bestNumber(),
    ])

    if (!votesRaw || votesRaw.isDelegating) return undefined

    const votes = votesRaw.asDirect.votes.map(([id, dataRaw]) => {
      const test = dataRaw.asStandard

      return {
        id: id.toString(),
        balance: test.balance.toBigNumber(),
        conviction: test.vote.conviction.toString(),
      }
    })

    const votedAmounts = await Promise.all(
      votes.map(async (vote) => {
        const voteId = vote.id
        const referendumRaw = await api.query.democracy.referendumInfoOf(voteId)
        const referendum = referendumRaw.unwrap()
        const isFinished = referendum.isFinished

        const endBlock = isFinished
          ? referendum.asFinished.end.toBigNumber()
          : referendum.asOngoing.end.toBigNumber()
        const convictionBlock =
          CONVICTIONS_BLOCKS[vote.conviction.toLocaleLowerCase()]
        const unlockBlockNumber = endBlock.plus(convictionBlock)
        const isUnlocked = isFinished
          ? unlockBlockNumber.lte(currentBlock.toNumber())
          : false

        return {
          isUnlocked,
          amount: vote.balance,
          id: voteId,
          endDiff: unlockBlockNumber.minus(currentBlock.toNumber()),
        }
      }),
    )

    const unlockedVotes = votedAmounts.reduce<{
      maxUnlockedValue: BN
      maxLockedValue: BN
      maxLockedBlock: BN
      ids: string[]
    }>(
      (acc, votedAmount) => {
        if (votedAmount.isUnlocked)
          return {
            maxUnlockedValue: BN.maximum(
              acc.maxUnlockedValue,
              votedAmount.amount,
            ),
            maxLockedValue: acc.maxLockedValue,
            maxLockedBlock: BN.maximum(votedAmount.endDiff, acc.maxLockedBlock),
            ids: [...acc.ids, votedAmount.id],
          }

        return {
          maxLockedValue: BN.maximum(acc.maxLockedValue, votedAmount.amount),
          maxUnlockedValue: acc.maxUnlockedValue,
          maxLockedBlock: BN.maximum(votedAmount.endDiff, acc.maxLockedBlock),
          ids: acc.ids,
        }
      },
      {
        maxUnlockedValue: BN_0,
        maxLockedValue: BN_0,
        ids: [],
        maxLockedBlock: BN_0,
      },
    )

    return unlockedVotes
  }
