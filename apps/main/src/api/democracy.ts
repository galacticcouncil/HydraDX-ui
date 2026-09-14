import { queryOptions } from "@tanstack/react-query"
import Big from "big.js"
import { millisecondsInMinute } from "date-fns/constants"
import { number, string, z } from "zod/v4"

import { bestNumberQuery } from "@/api/chain"
import { accountVotesQuery, SubsquareVoteState } from "@/api/external/subsquare"
import { Papi } from "@/api/rpcClient"
import { TProviderContext } from "@/providers/rpcProvider"
import { GC_TIME, STALE_TIME } from "@/utils/consts"

export type CastingVoteInfo = Extract<
  Awaited<
    ReturnType<Papi["query"]["ConvictionVoting"]["VotingFor"]["getEntries"]>
  >[number]["value"],
  { type: "Casting" }
>["value"]

export type ConvictionVotingVoteAccountVote =
  CastingVoteInfo["votes"][number][1]

export type GovReferendaStatus = Awaited<
  ReturnType<Papi["query"]["Referenda"]["ReferendumInfoFor"]["getEntries"]>
>[number]["value"] & {
  readonly id: number
}

export type OngoingGovReferenda = Extract<
  GovReferendaStatus,
  { type: "Ongoing" }
>["value"]

export type TUnlockableVote = {
  voteId: number
  classId: number
}

export const CONVICTIONS = [0, 1, 2, 3, 4, 5, 6] as const
export type Conviction = (typeof CONVICTIONS)[number]

const CONVICTION_NAMES = [
  "none",
  "locked1x",
  "locked2x",
  "locked3x",
  "locked4x",
  "locked5x",
  "locked6x",
] as const

const LOCK_PERIODS_BY_CONVICTION: Record<Conviction, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
  6: 32,
}

export const VOTE_WEIGHT_BY_CONVICTION: Record<Conviction, number> = {
  0: 0.1,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
}

export const REWARD_MULTIPLIER_BY_CONVICTION: Record<Conviction, number> = {
  0: 0,
  1: 0.25,
  2: 0.5,
  3: 1,
  4: 2,
  5: 4,
  6: 8,
}

const toConviction = (value: string | number): Conviction | undefined =>
  CONVICTIONS.find((c) => c === value || CONVICTION_NAMES[c] === value)

export const getConvictionBlocks = (
  voteLockingPeriodBlocks: number,
  conviction: string | number,
) => {
  const index = toConviction(conviction)
  if (index === undefined) return undefined

  return LOCK_PERIODS_BY_CONVICTION[index] * voteLockingPeriodBlocks
}

export const voteLockingPeriodQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["voteLockingPeriod"],
    enabled: rpc.isReady,
    staleTime: Infinity,
    queryFn: async () =>
      Number(await rpc.papi.constants.ConvictionVoting.VoteLockingPeriod()),
  })

export const decodeStandardVote = (packedVote: number) => {
  const aye = (packedVote & 0x80) !== 0
  const index = packedVote & 0x7f
  const conviction = CONVICTION_NAMES[index] ?? "none"
  return { conviction, aye }
}

const getVoteAmount = (vote: ConvictionVotingVoteAccountVote) => {
  if (vote.type === "Split") {
    return vote.value.aye + vote.value.nay
  } else if (vote.type === "Standard") {
    return vote.value.balance
  } else if (vote.type === "SplitAbstain") {
    return vote.value.aye + vote.value.nay + vote.value.abstain
  } else {
    return 0n
  }
}

const getVoteConviction = (vote: ConvictionVotingVoteAccountVote): string => {
  if (vote.type === "Standard") {
    return decodeStandardVote(vote.value.vote).conviction
  }
  return "none"
}

export type TVoteKind = "aye" | "nay" | "split" | "abstain"

export const convictionVoteWeightFactor = (
  conviction: string | number,
): number => VOTE_WEIGHT_BY_CONVICTION[toConviction(conviction) ?? 0]

/** Human-facing multiplier for Standard conviction (0.1x … 6x). */
export const convictionVoteMultiplierForDisplay = (
  conviction: string | number,
): string => `${convictionVoteWeightFactor(conviction)}x`

const voteKindFromAccountVote = (
  vote: ConvictionVotingVoteAccountVote,
): TVoteKind => {
  if (vote.type === "Standard") {
    return decodeStandardVote(vote.value.vote).aye ? "aye" : "nay"
  }

  return vote.type === "Split" ? "split" : "abstain"
}

export const referendumInfoQuery = (
  { papi, isReady }: TProviderContext,
  referendumIndex: number,
) =>
  queryOptions({
    enabled: isReady,
    staleTime: millisecondsInMinute,
    queryKey: ["referendumInfoQuery", referendumIndex],
    queryFn: async () => {
      const value = await papi.query.Referenda.ReferendumInfoFor.getValue(
        referendumIndex,
        {
          at: "best",
        },
      )

      return { id: referendumIndex, value }
    },
  })

export const ongoingReferendaQuery = ({ papi, isReady }: TProviderContext) =>
  queryOptions({
    queryKey: ["ongoingReferenda"],
    enabled: isReady,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    queryFn: async () => {
      const newReferendums =
        await papi.query.Referenda.ReferendumInfoFor.getEntries({
          at: "best",
        })

      const ongoingReferendums = []

      for (const { keyArgs, value } of newReferendums) {
        if (value.type === "Ongoing") {
          ongoingReferendums.push({
            id: keyArgs[0],
            ...value.value,
          })
        }
      }

      return ongoingReferendums
    },
  })

export type TAccountVote = {
  readonly id: number
  readonly classId: number
  readonly balance: bigint
  readonly conviction: string
  readonly voteKind: TVoteKind
}

type TAccountOpenGovVotesAccumulator = {
  votes: TAccountVote[]
  classIds: Set<number>
}

export const accountOpenGovVotesQuery = (
  { papi, isReady }: TProviderContext,
  address: string,
) => {
  return queryOptions({
    queryKey: ["accountOpenGovVotes", address],
    queryFn: async () => {
      const voteEntries =
        await papi.query.ConvictionVoting.VotingFor.getEntries(address, {
          at: "best",
        })

      const { votes, classIds } =
        voteEntries.reduce<TAccountOpenGovVotesAccumulator>(
          (acc, voteClass) => {
            if (voteClass.value.type !== "Casting") {
              return acc
            }

            const votes = voteClass.value.value.votes
            const classId = voteClass.keyArgs[1]

            votes.forEach(([id, data]) => {
              acc.votes.push({
                id,
                classId,
                balance: getVoteAmount(data),
                conviction: getVoteConviction(data),
                voteKind: voteKindFromAccountVote(data),
              })
            })
            acc.classIds.add(classId)

            return acc
          },
          { votes: [], classIds: new Set([]) },
        )

      return { votes, classIds: Array.from(classIds) }
    },
    enabled: isReady && !!address,
    refetchInterval: millisecondsInMinute,
  })
}

const REFERENDUM_DATA_URL =
  "https://hydration-api.subsquare.io/gov2/referendums"

const referendumSchema = z
  .object({
    title: string().nullable().optional(),
    referendumIndex: number().nullable().optional(),
    motionIndex: number().nullable().optional(),
  })
  .nullable()

export const referendumSubscanInfoQuery = (referendumIndex: number) =>
  queryOptions({
    queryKey: ["referendumInfo", referendumIndex],
    queryFn: async () => {
      const res = await fetch(`${REFERENDUM_DATA_URL}/${referendumIndex}.json`)
      if (!res.ok) return null

      const json = await res.json()
      const parsed = referendumSchema.parse(json)

      if (
        !parsed ||
        parsed.referendumIndex === null ||
        parsed.motionIndex === null ||
        parsed.title === null
      )
        return null

      return parsed
    },
  })

type TChainVotes = {
  isRemovable: boolean
  amount: bigint
  id: number
  classId: number
  endDiff: number | undefined
  diffBlockNumber: number | undefined
  locked: boolean
}

type TIndexedVotes = {
  id: number
  amount: bigint
  locked: boolean
  diffBlockNumber: number | undefined
}

export const openGovUnlockedTokensQueryKey = (address: string) => [
  "openGovUnlockedTokens",
  address,
]

export const accountUnlockClassesQuery = (
  rpc: TProviderContext,
  address: string,
) =>
  queryOptions({
    enabled: rpc.isReady && !!address,
    queryKey: ["accountUnlockClasses", address],
    queryFn: async () => {
      const classLocksRaw =
        await rpc.papi.query.ConvictionVoting.ClassLocksFor.getValue(address, {
          at: "best",
        })

      const lockClasses = new Set<number>()

      for (const [classId, balance] of classLocksRaw) {
        if (balance === 0n) continue
        lockClasses.add(classId)
      }

      return Array.from(lockClasses)
    },
  })

export const openGovUnlockedTokensQuery = (
  rpc: TProviderContext,
  address: string,
  indexerUrl: string,
) =>
  queryOptions({
    queryKey: openGovUnlockedTokensQueryKey(address),
    queryFn: async () => {
      const [accountVotes, bestNumber, subsquareAccountVotes, voteLocking] =
        await Promise.all([
          rpc.queryClient.ensureQueryData(
            accountOpenGovVotesQuery(rpc, address),
          ),
          rpc.queryClient.ensureQueryData(bestNumberQuery(rpc)),
          rpc.queryClient.ensureQueryData(
            accountVotesQuery(address, indexerUrl),
          ),
          rpc.queryClient.ensureQueryData(voteLockingPeriodQuery(rpc)),
        ])
      if (!bestNumber) {
        throw new Error("Best number not found")
      }

      const currentBlock = bestNumber.parachainBlockNumber

      const indexedVotes: TIndexedVotes[] = []
      for (const vote of subsquareAccountVotes.items) {
        const status = vote.proposal.state.name

        const balance = vote.balance ?? vote.abstainBalance ?? "0"
        if (status === SubsquareVoteState.Executed) {
          const convictionBlockNumber = getConvictionBlocks(
            voteLocking,
            vote.conviction,
          )

          if (convictionBlockNumber === undefined) {
            indexedVotes.push({
              amount: BigInt(balance),
              id: vote.referendumIndex,
              locked: true,
              diffBlockNumber: undefined,
            })
            continue
          }

          const unlockBlockNumber =
            vote.proposal.state.indexer.blockHeight + convictionBlockNumber

          const diffBlockNumber = unlockBlockNumber - currentBlock

          indexedVotes.push({
            id: vote.referendumIndex,
            amount: BigInt(balance),
            locked: Big(unlockBlockNumber).gt(currentBlock),
            diffBlockNumber,
          })
          continue
        } else if (
          status === SubsquareVoteState.Ongoing ||
          status === SubsquareVoteState.Deciding ||
          status === SubsquareVoteState.Confirming
        ) {
          indexedVotes.push({
            id: vote.referendumIndex,
            amount: BigInt(balance),
            locked: true,
            diffBlockNumber: undefined,
          })
          continue
        } else {
          continue
        }
      }

      const votesData: TChainVotes[] = await Promise.all(
        accountVotes.votes.map(async (accountVote) => {
          const { value: referendumInfo } =
            await rpc.queryClient.ensureQueryData(
              referendumInfoQuery(rpc, accountVote.id),
            )

          if (!referendumInfo) {
            return {
              isRemovable: false,
              amount: accountVote.balance,
              id: accountVote.id,
              classId: accountVote.classId,
              endDiff: undefined,
              locked: false,
              diffBlockNumber: undefined,
            }
          }

          if (referendumInfo.type === "Ongoing") {
            return {
              isRemovable: false,
              amount: accountVote.balance,
              id: accountVote.id,
              classId: accountVote.classId,
              endDiff: undefined,
              locked: true,
              diffBlockNumber: undefined,
            }
          } else {
            const endBlock =
              referendumInfo.type === "Killed"
                ? referendumInfo.value
                : referendumInfo.value[0]
            const convictionBlockNumber = getConvictionBlocks(
              voteLocking,
              accountVote.conviction,
            )

            if (convictionBlockNumber === undefined) {
              throw new Error("Invalid conviction")
            }

            const unlockBlockNumber = endBlock + convictionBlockNumber

            const diffBlockNumber = unlockBlockNumber - currentBlock

            return {
              isRemovable: true,
              amount: accountVote.balance,
              id: accountVote.id,
              classId: accountVote.classId,
              endDiff: unlockBlockNumber - currentBlock,
              diffBlockNumber,
              locked: Big(unlockBlockNumber).gt(currentBlock),
            }
          }
        }),
      )

      const votesById = new Map<number, TIndexedVotes | TChainVotes>()

      for (const vote of indexedVotes) {
        votesById.set(vote.id, vote)
      }

      for (const vote of votesData) {
        votesById.set(vote.id, vote)
      }

      const mergedVotesMax = [...votesById.values()].reduce<{
        maxLockedValue: string
        maxLockedBlock: number | undefined
        votesToRemove: TUnlockableVote[]
      }>(
        (acc, voteData) => {
          if ("classId" in voteData && voteData.isRemovable) {
            acc.votesToRemove.push({
              voteId: voteData.id,
              classId: voteData.classId,
            })
          }

          if (!voteData.locked) return acc

          return {
            maxLockedValue: Big.max(
              acc.maxLockedValue,
              voteData.amount.toString(),
            ).toString(),
            maxLockedBlock:
              voteData.diffBlockNumber !== undefined &&
              acc.maxLockedBlock !== undefined
                ? Big.max(
                    voteData.diffBlockNumber,
                    acc.maxLockedBlock ?? 0,
                  ).toNumber()
                : undefined,
            votesToRemove: acc.votesToRemove,
          }
        },
        {
          maxLockedValue: "0",
          maxLockedBlock: 0,
          votesToRemove: [],
        },
      )

      return mergedVotesMax
    },
  })
