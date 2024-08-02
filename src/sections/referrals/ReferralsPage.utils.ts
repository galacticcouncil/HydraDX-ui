import { useReferrerInfo } from "api/referrals"
import BN from "bignumber.js"
import { useAccountRewards } from "./components/RewardsCard/Rewards.utils"
import { useMemo } from "react"
import { useAssets } from "providers/assets"

export const REFERRAL_PROD_HOST = "hydration.net"
export const REFERRAL_PARAM_NAME = "referral"
export const REFERRAL_CODE_MAX_LENGTH = 7
export const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9]+$/

export const referralRewards: Record<
  number,
  { referrer: BN; user: BN; threshold: BN }
> = {
  0: { referrer: BN(5), user: BN(10), threshold: BN(0) },
  1: { referrer: BN(10), user: BN(11), threshold: BN(305) },
  2: { referrer: BN(15), user: BN(12), threshold: BN(4583) },
  3: { referrer: BN(20), user: BN(13), threshold: BN(61111) },
  4: { referrer: BN(25), user: BN(15), threshold: BN(763888) },
}

export const useReferrerTierData = (referrerAddress?: string) => {
  const { native } = useAssets()
  const referrerInfo = useReferrerInfo(referrerAddress)
  const accountRewards = useAccountRewards(referrerAddress)

  const currentTierData =
    referrerInfo.data && referrerInfo.data.tier !== undefined
      ? referralRewards[referrerInfo.data.tier]
      : undefined

  const tierProgress = useMemo(() => {
    const totalRewards = referrerInfo.data?.paidRewards
      .shiftedBy(-native.decimals)
      .plus(accountRewards.data?.referrerRewards ?? 0)

    const nextTierData =
      referrerInfo.data && referrerInfo.data.tier !== undefined
        ? referralRewards[referrerInfo.data.tier + 1]
        : undefined

    if (totalRewards && nextTierData) {
      return totalRewards.gt(nextTierData.threshold)
        ? BN(100)
        : totalRewards.div(nextTierData.threshold).multipliedBy(100)
    }

    return undefined
  }, [accountRewards.data, native.decimals, referrerInfo.data])

  const isLevelUp = tierProgress?.gte(100) && referrerInfo.data?.tier !== 4

  return { referrerInfo, currentTierData, tierProgress, isLevelUp }
}
