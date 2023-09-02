import { DECIMAL_PLACES } from "@galacticcouncil/sdk"
import { useTokenBalance } from "api/balances"
import { useBestNumber } from "api/chain"
import { useReferendumInfo, useReferendumInfoOf } from "api/democracy"
import { useMemo } from "react"
import { useAccountStore } from "state/store"
import { NATIVE_ASSET_ID } from "utils/api"
import { BN_0, PARACHAIN_BLOCK_TIME } from "utils/constants"
import { customFormatDuration } from "utils/formatting"
import BN from "bignumber.js"

export const useVotingData = (id: string, isRococo: boolean) => {
  const { account } = useAccountStore()

  const bestNumber = useBestNumber()
  const balance = useTokenBalance(NATIVE_ASSET_ID, account?.address)
  const referenda = useReferendumInfoOf(id)
  const referendaInfo = useReferendumInfo(isRococo ? undefined : id)

  const isLoading =
    referenda.isLoading ||
    referendaInfo.isInitialLoading ||
    bestNumber.isLoading ||
    balance.isInitialLoading

  const data = useMemo(() => {
    if (isLoading || !referenda.data || !bestNumber.data) return undefined

    const { isOngoing } = referenda.data
    const { freeBalance, reservedBalance } = balance.data ?? {}

    const computedBalance = freeBalance?.minus(reservedBalance ?? 0) ?? BN_0

    let ayes = BN_0
    let nays = BN_0
    let percAyes = BN_0
    let percNays = BN_0

    if (isOngoing) {
      ayes = referenda.data.asOngoing.tally.ayes
        .toBigNumber()
        .shiftedBy(-DECIMAL_PLACES)
      nays = referenda.data.asOngoing.tally.nays
        .toBigNumber()
        .shiftedBy(-DECIMAL_PLACES)

      const votesSum = ayes.plus(nays)

      if (!votesSum.isZero()) {
        percAyes = ayes.div(votesSum).times(100)
        percNays = nays.div(votesSum).times(100)
      }
    }

    let referendaData = {
      title: "Referenda title",
      content: "This is a referenda content",
      ayeCount: 0,
      nayCount: 0,
      author: { address: "" },
      authorDisplay: { name: "unknown author", verified: false },
      referendumIndex: 0,
    }

    const diff = (
      isRococo
        ? isOngoing
          ? referenda.data.asOngoing.end.toBigNumber()
          : BN_0
        : BN(referendaInfo.data?.onchainData.meta.end ?? 0)
    )
      .minus(bestNumber.data?.parachainBlockNumber.toBigNumber() ?? 0)
      .times(PARACHAIN_BLOCK_TIME)
      .toNumber()

    const endDate = customFormatDuration({ end: diff * 1000 })

    if (!isRococo && referendaInfo.data) referendaData = referendaInfo.data

    const isNoVotes = percAyes.eq(0) && percNays.eq(0)

    return {
      ayes,
      nays,
      percAyes,
      percNays,
      computedBalance,
      isNoVotes,
      endDate,
      ...referendaData,
    }
  }, [
    isLoading,
    referenda.data,
    bestNumber.data,
    balance.data,
    isRococo,
    referendaInfo.data,
  ])

  return { data, isLoading, isOngoing: referenda.data?.isOngoing }
}
