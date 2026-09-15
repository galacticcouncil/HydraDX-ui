import {
  HDX_ERC20_ASSET_ID,
  STHDX_ASSET_ID,
} from "@galacticcouncil/money-market/ui-config"
import { QUERY_KEY_BLOCK_PREFIX } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { queryOptions, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { millisecondsInHour, millisecondsInMinute } from "date-fns/constants"
import { maxUint32 } from "viem"

import { accountOpenGovVotesQuery, referendumInfoQuery } from "@/api/democracy"
import { TProviderContext, useRpcProvider } from "@/providers/rpcProvider"
import { GC_TIME } from "@/utils/consts"

/**
 * Gigapot account — yield reservoir backing the GIGAHDX exchange rate.
 * Derived from `pallet_gigahdx::Config::PalletId = b"gigahdx!"` via
 * `into_account_truncating`. Encoded with the generic Substrate SS58 prefix
 * (42); polkadot-api decodes to raw bytes so the prefix is cosmetic.
 *
 * Exchange-rate numerator (per runtime):
 *   `total_staked_hdx = GigaHdx.TotalLocked + System.Account(<this>).data.free`
 */
export const STAKE_GIGAPOT_ADDRESS =
  "5EYCAe5gvQVxGzukiQoZHF12jtT9iP8tBJSxEkZdRYBZ4jqK"

export const gigaStakeConstantsQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["gigaStake", "constants"],
    queryFn: async () => {
      const [minStake, cooldownPeriod, maxPendingUnstakes] = await Promise.all([
        rpc.papi.constants.GigaHdx.MinStake(),
        rpc.papi.constants.GigaHdx.CooldownPeriod(),
        rpc.papi.constants.GigaHdx.MaxPendingUnstakes(),
      ])

      return {
        minStake,
        cooldownPeriod,
        maxPendingUnstakes,
      }
    },
    staleTime: millisecondsInHour,
    gcTime: GC_TIME,
  })

type UnsafeTwoSecBlocksSinceQuery = {
  Parameters: {
    TwoSecBlocksSince: { getValue: () => Promise<number | undefined> }
  }
}

/**
 * `Parameters.TwoSecBlocksSince` — block height of the 6s→2s switch,
 * set once by the `SetTwoSecBlocksSince` runtime migration (`u32::MAX`
 * sentinel until it happens). Canonical anchor consumed by both
 * pallet-staking and pallet-gigahdx via `TwoSecBlocksSinceProvider`.
 * Read via the unsafe api: the pallet is newer than the generated
 * descriptors. Resolves `null` on runtimes that don't expose it
 * (pre-2s), which callers treat as "no switch — plain arithmetic".
 */
export const gigaTwoSecBlocksSinceQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["gigaStake", "twoSecBlocksSince"],
    enabled: rpc.isReady,
    staleTime: millisecondsInHour,
    gcTime: GC_TIME,
    queryFn: async (): Promise<number | null> => {
      try {
        const query = rpc.papiClient.getUnsafeApi()
          .query as unknown as UnsafeTwoSecBlocksSinceQuery
        const value = await query.Parameters.TwoSecBlocksSince.getValue()
        return value === undefined ? null : Number(value)
      } catch {
        return null
      }
    },
  })

/**
 * Mirrors `pallet-gigahdx::cooldown_expires_at`: positions unstaked before
 * the 2s switch preserve their remaining wall-clock cooldown. They were
 * created against the 6s-denominated cooldown (a third of the current
 * constant); whatever portion of that old cooldown remains at the switch is
 * re-denominated ×3 into 2s blocks.
 */
export const getCooldownExpiresAt = (
  unstakedAt: number,
  cooldownPeriod: number,
  twoSecBlocksSince: number | null,
): number => {
  if (
    twoSecBlocksSince === null ||
    twoSecBlocksSince >= Number(maxUint32) ||
    unstakedAt >= twoSecBlocksSince
  ) {
    return unstakedAt + cooldownPeriod
  }

  const oldExpiresAt = unstakedAt + Math.floor(cooldownPeriod / 3)
  if (oldExpiresAt <= twoSecBlocksSince) return oldExpiresAt

  return twoSecBlocksSince + (oldExpiresAt - twoSecBlocksSince) * 3
}

export const gigaQueryKey = (address: string) => ["gigaStake", address]

export const gigaUnstakePositionsQuery = (
  rpc: TProviderContext,
  address: string,
) =>
  queryOptions({
    queryKey: [...gigaQueryKey(address), "pendingPositions"],
    enabled: !!address && rpc.isReady,
    queryFn: async () => {
      const entries = await rpc.papi.query.GigaHdx.PendingUnstakes.getEntries(
        address,
        { at: "best" },
      )

      return entries.map(({ keyArgs, value }) => ({
        amount: value,
        voteAtBlock: keyArgs[1],
      }))
    },
  })

export const gigaAccountStakesQuery = (
  rpc: TProviderContext,
  address: string,
) =>
  queryOptions({
    queryKey: [...gigaQueryKey(address), "stakes"],
    enabled: !!address && rpc.isReady,
    queryFn: async () => {
      const stakes = await rpc.papi.query.GigaHdx.Stakes.getValue(address, {
        at: "best",
      })

      return stakes ?? null
    },
  })

export const gigaAccountBalanceQuery = (
  rpc: TProviderContext,
  address: string,
) =>
  queryOptions({
    queryKey: [...gigaQueryKey(address), "balance"],
    enabled: !!address && rpc.isReady,
    queryFn: async () => {
      const balance = await rpc.sdk.client.balance.getErc20Balance(
        address,
        Number(HDX_ERC20_ASSET_ID),
      )

      return balance
    },
  })

export const useGigaAccountBalance = () => {
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const address = account?.address ?? ""
  return useQuery(gigaAccountBalanceQuery(rpc, address))
}

export const gigaTotalLockedQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: [QUERY_KEY_BLOCK_PREFIX, "gigaTotalLocked"],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    gcTime: millisecondsInMinute,
    queryFn: async () => {
      const totalLocked = await rpc.papi.query.GigaHdx.TotalLocked.getValue({
        at: "best",
      })

      return totalLocked
    },
  })

export const gigaHDXIssuanceQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: [QUERY_KEY_BLOCK_PREFIX, "totalIssuance", STHDX_ASSET_ID],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    gcTime: millisecondsInMinute,
    queryFn: async () => {
      return await rpc.papi.query.Tokens.TotalIssuance.getValue(
        Number(STHDX_ASSET_ID),
        {
          at: "best",
        },
      )
    },
  })

export const gigapotBalanceQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: [QUERY_KEY_BLOCK_PREFIX, "gigapotBalance"],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    gcTime: millisecondsInMinute,
    queryFn: async () => {
      const { free } = await rpc.sdk.client.balance.getSystemBalance(
        STAKE_GIGAPOT_ADDRESS,
      )
      return free
    },
  })

export const referendaRewardPoolQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["referendaRewardPool"],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      const entries =
        await rpc.papi.query.GigaHdxRewards.ReferendaRewardPool.getEntries({
          at: "best",
        })

      return new Map(entries.map(({ keyArgs, value }) => [keyArgs[0], value]))
    },
  })

export type ReferendaTotalWeightedVotesEntry = {
  total_weighted: bigint
  voters_count: number
}

export const referendaTotalWeightedVotesQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["referendaTotalWeightedVotes"],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      const entries =
        await rpc.papi.query.GigaHdxRewards.ReferendaTotalWeightedVotes.getEntries(
          {
            at: "best",
          },
        )

      return new Map(entries.map(({ keyArgs, value }) => [keyArgs[0], value]))
    },
  })

export const useGigaStakeExchangeRate = () => {
  const rpc = useRpcProvider()

  const {
    data: totalIssuance,
    isSuccess: isTotalIssuanceSuccess,
    isLoading: isTotalIssuanceLoading,
  } = useQuery(gigaHDXIssuanceQuery(rpc))
  const {
    data: gigaLockedHDX,
    isSuccess: isGigaLockedHDXSuccess,
    isLoading: isGigaLockedHDXLoading,
  } = useQuery(gigaTotalLockedQuery(rpc))
  const {
    data: gigapotFree,
    isSuccess: isGigapotSuccess,
    isLoading: isGigapotLoading,
  } = useQuery(gigapotBalanceQuery(rpc))

  const allReady =
    isTotalIssuanceSuccess && isGigaLockedHDXSuccess && isGigapotSuccess
  const isLoading =
    isTotalIssuanceLoading || isGigaLockedHDXLoading || isGigapotLoading

  if (!allReady)
    return {
      isLoading,
      data: undefined,
    }

  const supply = Big(totalIssuance.toString())
  const numerator = Big(gigaLockedHDX.toString()).plus(gigapotFree.toString())
  const raw = numerator.div(supply)
  const rate = Big.max(1, raw)

  return {
    isLoading,
    data: rate,
  }
}

/**
 * Accumulator pot — holds undistributed fee inflow for voting rewards.
 * Derived from `GigaHdxRewards.RewardPotPalletId = b"gigarwd!"`.
 *
 * Per-track allocation percentages: when a vote is first removed on a
 * completed referendum, `track_pct × accumulator_pot.balance` is moved to
 * the allocated-rewards pot and snapshotted into `ReferendaRewardPool`.
 */
export const REWARD_ACCUMULATOR_POT_ADDRESS =
  "5EYCAe5gvQVxHJoTZGemUumm5Z56Uwvix3eNFz2mHbA8kgft"

// Must mirror `TrackRewardConfig::reward_percentage` in runtime/hydradx/src/gigahdx.rs.
const REWARD_TRACK_PERCENTAGES: Record<number, number> = {
  0: 10, // root
  1: 8, // whitelisted_caller
  5: 5, // treasurer
  9: 5, // economic_parameters
}
const DEFAULT_TRACK_PERCENTAGE = 2

export const getRewardTrackPercentage = (trackId: number): number =>
  REWARD_TRACK_PERCENTAGES[trackId] ?? DEFAULT_TRACK_PERCENTAGE

export const accumulatorPotBalanceQuery = (rpc: TProviderContext) =>
  queryOptions({
    queryKey: ["accumulatorPotBalance"],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      return await rpc.sdk.client.balance.getSystemBalance(
        REWARD_ACCUMULATOR_POT_ADDRESS,
      )
    },
  })

export const gigaRewardPoolEstimateQuery = (
  rpc: TProviderContext,
  refId: number,
  trackId: number,
) =>
  queryOptions({
    queryKey: ["gigaRewardPoolEstimate", refId],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      const rewardPools = await rpc.queryClient.fetchQuery(
        referendaRewardPoolQuery(rpc),
      )
      const allocated = rewardPools.get(refId)

      if (allocated) {
        return {
          amount: BigInt(allocated.total_reward),
          isEstimate: false,
        }
      }

      const { free } = await rpc.queryClient.fetchQuery(
        accumulatorPotBalanceQuery(rpc),
      )

      const pct = getRewardTrackPercentage(trackId)
      return {
        amount: (free * BigInt(pct)) / 100n,
        isEstimate: true,
      }
    },
  })

export const referendumTracksQuery = (rpc: TProviderContext, refId: number) =>
  queryOptions({
    queryKey: ["referendumTracks", refId],
    enabled: rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      const data =
        await rpc.papi.query.GigaHdxRewards.ReferendumTracks.getValue(refId, {
          at: "best",
        })

      return data ?? null
    },
  })

/**
 * Total voting rewards the user can claim *right now* if they triggered
 * the full "claim & compound" batch, plus the metadata needed to build
 * that batch — and the breakdown of which `Stakes.frozen` contribution is
 * releasable vs. permanently locked from the unstake form's perspective.
 *
 * Components:
 *   pendingHdx       = GigaHdxRewards.PendingRewards[who]
 *                      (already credited — claimable directly via claim_rewards)
 *
 *   allocReadyHdx    = Σ (per-ref share) over every UserVoteRecord[who, ref]
 *                      for completed referenda. Includes Approved/Rejected
 *                      with any conviction — `remove_vote` (the voter calling
 *                      it themselves) always succeeds post-completion. The
 *                      conviction-period lock on the underlying HDX balance
 *                      persists separately in `pallet-balances` and does not
 *                      block `remove_vote` or reward allocation.
 *
 *   allocReadyVotes  = list of (refIndex, trackId) for the `remove_vote`
 *                      calls in the batch.
 *
 *   unlockClasses    = track-class ids to `ConvictionVoting.unlock` against
 *                      (cleans up balance locks, both fresh and legacy).
 *
 *   unfreezableHdx   = Σ `staked_vote_amount` over completed-ref UserVoteRecords.
 *                      This is the portion of `Stakes.frozen` that the
 *                      "Claim rewards" batch (or combined unlock+unstake batch)
 *                      will release by running `remove_vote` × N — making
 *                      that much extra GIGAHDX unstakeable in the same batch.
 *
 *   ongoingLockedHdx = max `staked_vote_amount` over ongoing-ref UserVoteRecords.
 *                      Permanently locked from unstake-flow's perspective:
 *                      we don't auto-remove active votes (would interrupt the
 *                      user's voting commitment). Released only when the ref
 *                      ends + user removes the vote (or manually removes now,
 *                      forfeiting the active vote).
 *
 *
 * Used by the "Claim rewards" button (`useClaimAndCompound`) and the unstake
 * form's combined unlock+unstake flow.
 */
export const claimableVotingRewardsQuery = (
  rpc: TProviderContext,
  who: string,
) =>
  queryOptions({
    queryKey: [...gigaQueryKey(who), "claimableVotingRewards"],
    enabled: !!who && rpc.isReady,
    staleTime: millisecondsInMinute,
    queryFn: async () => {
      const [pendingHdx, userVoteEntries] = await Promise.all([
        rpc.papi.query.GigaHdxRewards.PendingRewards.getValue(who, {
          at: "best",
        }),
        rpc.papi.query.GigaHdxRewards.UserVoteRecords.getEntries(who, {
          at: "best",
        }),
      ])

      if (userVoteEntries.length === 0) {
        return {
          pendingHdx,
          allocReadyHdx: 0n,
          allocReadyVotes: [],
          unfreezableHdx: 0n,
          ongoingLockedHdx: 0n,
        }
      }

      const [
        accumulatorAccount,
        votingForEntries,
        rewardPools,
        liveWeightedVotes,
      ] = await Promise.all([
        rpc.queryClient.fetchQuery(accumulatorPotBalanceQuery(rpc)),
        rpc.queryClient.fetchQuery(accountOpenGovVotesQuery(rpc, who)),
        rpc.queryClient.fetchQuery(referendaRewardPoolQuery(rpc)),
        rpc.queryClient.fetchQuery(referendaTotalWeightedVotesQuery(rpc)),
      ])

      const potFree = accumulatorAccount.free
      const refToClassFromVotingFor = new Map<number, number>()

      for (const vote of votingForEntries.votes) {
        refToClassFromVotingFor.set(Number(vote.id), vote.classId)
      }

      const promises = userVoteEntries.map(
        async ({ keyArgs: [, refIndex], value: record }) => {
          const refInfo = await rpc.queryClient.ensureQueryData(
            referendumInfoQuery(rpc, refIndex),
          )

          const reInfoType = refInfo?.value?.type
          if (!reInfoType)
            return {
              ongoingLockedHdx: 0n,
              allocReadyHdx: 0n,
              unfreezableHdx: 0n,
              allocReadyVote: null,
            }

          if (reInfoType === "Ongoing") {
            return {
              allocReadyHdx: 0n,
              unfreezableHdx: 0n,
              allocReadyVote: null,
              ongoingLockedHdx: record.staked_vote_amount,
            }
          }

          let share = 0n
          const weighted = record.weighted
          const allocated = rewardPools.get(refIndex)
          const referendumTrack = await rpc.queryClient.ensureQueryData(
            referendumTracksQuery(rpc, refIndex),
          )
          const trackId =
            referendumTrack ?? refToClassFromVotingFor.get(refIndex) ?? null

          if (allocated) {
            const totalReward = allocated.total_reward
            const totalWeighted = allocated.total_weighted_votes

            if (totalWeighted > 0n) {
              share = (weighted * totalReward) / totalWeighted
            }
          } else if (trackId !== null) {
            const liveTally = liveWeightedVotes.get(refIndex)

            if (liveTally) {
              const pct = getRewardTrackPercentage(trackId)
              const allocation = (potFree * BigInt(pct)) / 100n
              const totalWeighted = liveTally.total_weighted

              if (totalWeighted > 0n) {
                share = (weighted * allocation) / totalWeighted
              }
            }
          }

          return {
            ongoingLockedHdx: 0n,
            allocReadyHdx: share,
            unfreezableHdx: record.staked_vote_amount,
            allocReadyVote: {
              refIndex,
              trackId,
            },
          }
        },
      )

      const promisesRes = await Promise.all(promises)

      const {
        ongoingLockedHdx,
        allocReadyHdx,
        unfreezableHdx,
        allocReadyVotes,
      } = promisesRes.reduce<{
        ongoingLockedHdx: bigint
        allocReadyHdx: bigint
        unfreezableHdx: bigint
        allocReadyVotes: Array<{ refIndex: number; trackId: number | null }>
      }>(
        (acc, curr) => {
          return {
            ongoingLockedHdx:
              acc.ongoingLockedHdx > curr.ongoingLockedHdx
                ? acc.ongoingLockedHdx
                : curr.ongoingLockedHdx,
            allocReadyHdx: acc.allocReadyHdx + curr.allocReadyHdx,
            allocReadyVotes: curr.allocReadyVote
              ? [...acc.allocReadyVotes, curr.allocReadyVote]
              : acc.allocReadyVotes,
            unfreezableHdx: acc.unfreezableHdx + curr.unfreezableHdx,
          }
        },
        {
          ongoingLockedHdx: 0n,
          allocReadyHdx: 0n,
          unfreezableHdx: 0n,
          allocReadyVotes: [],
        },
      )

      return {
        pendingHdx,
        allocReadyHdx,
        allocReadyVotes,
        unfreezableHdx,
        ongoingLockedHdx,
      }
    },
  })
