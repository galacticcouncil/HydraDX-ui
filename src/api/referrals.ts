import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { useRpcProvider } from "providers/rpcProvider"
import { QUERY_KEYS } from "utils/queryKeys"
import { u32 } from "@polkadot/types"
import { undefinedNoop } from "utils/helpers"
import BN from "bignumber.js"
import { BN_NAN } from "utils/constants"
import { useAssets } from "providers/assets"

export const useReferralCodes = (accountAddress?: string | "all") => {
  const { api } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.referralCodes(accountAddress),
    accountAddress !== undefined
      ? async () => {
          const allCodes = await getReferralCodes(api)()

          return accountAddress !== "all"
            ? [allCodes.find((code) => code.accountAddress === accountAddress)]
            : allCodes
        }
      : undefinedNoop,
    { enabled: !!accountAddress },
  )
}

const getReferralCodes = (api: ApiPromise) => async () => {
  const rawData = await api.query.referrals.referralCodes.entries()

  const data = rawData.map(([rawCode, address]) => {
    const [code] = rawCode.toHuman() as string[]

    return {
      accountAddress: address.toString(),
      referralCode: code,
    }
  })

  return data
}

export const useReferralCodeLength = () => {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.referralCodeLength, async () => {
    const [maxLength, minLength] = (await Promise.all([
      api.consts.referrals.codeLength,
      api.consts.referrals.minCodeLength,
    ])) as [u32, u32]

    return {
      minLength: minLength.toBigNumber(),
      maxLength: maxLength.toBigNumber(),
    }
  })
}

export const useUserReferrer = (accountAddress?: string) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.userReferrer(accountAddress),
    !!accountAddress ? getUserReferrer(api, accountAddress) : undefinedNoop,
    {
      enabled: !!accountAddress,
    },
  )
}

const getUserReferrer =
  (api: ApiPromise, accountAddress: string) => async () => {
    const rawData = await api.query.referrals.linkedAccounts(accountAddress)
    //@ts-ignore
    const data = rawData.unwrapOr(null)

    return (data?.toString() as string) || null
  }

export const useReferrerInfo = (referrerAddress?: string) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.referrerInfo(referrerAddress),
    !!referrerAddress ? getReferrerInfo(api, referrerAddress) : undefinedNoop,
    {
      enabled: !!referrerAddress,
    },
  )
}

const getReferrerInfo =
  (api: ApiPromise, referrerAddress: string) => async () => {
    const rawData = await api.query.referrals.referrer(referrerAddress)

    if (rawData.isEmpty) {
      return {
        tier: undefined,
        paidRewards: BN_NAN,
      }
    }

    const [tier, paidRewards] = rawData.unwrap()

    return {
      tier: Number(tier.type.slice(-1)),
      paidRewards: paidRewards.toBigNumber() as BN,
    }
  }

export const useAccountReferralShares = (accountAddress?: string) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.accountReferralShares(accountAddress),
    !!accountAddress
      ? getAccountReferralShares(api, accountAddress)
      : undefinedNoop,
    {
      enabled: !!accountAddress,
    },
  )
}

const getAccountReferralShares =
  (api: ApiPromise, accountAddress: string) => async () => {
    const [totalSharesRaw, referrerSharesRaw, traderSharesRaw] =
      await Promise.all([
        api.query.referrals.totalShares(),
        api.query.referrals.referrerShares(accountAddress),
        api.query.referrals.traderShares(accountAddress),
      ])

    return {
      //@ts-ignore
      referrerShares: referrerSharesRaw.toBigNumber() as BN,
      //@ts-ignore
      traderShares: traderSharesRaw.toBigNumber() as BN,
      //@ts-ignore
      totalShares: totalSharesRaw.toBigNumber() as BN,
    }
  }

export const useReferrerAddress = (referrerCode: string) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.referrerAddress(referrerCode),
    !!referrerCode ? getReferrerAddress(api, referrerCode) : undefinedNoop,
    {
      enabled: !!referrerCode,
    },
  )
}

const getReferrerAddress =
  (api: ApiPromise, referrerCode: string) => async () => {
    const rawData = await api.query.referrals.referralCodes(referrerCode)
    //@ts-ignore
    const data = rawData.unwrapOr(null)

    return (data?.toString() as string) || null
  }

export const useAccountReferees = (referrerAddress?: string) => {
  const { api } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.accountReferees(referrerAddress),
    !!referrerAddress ? getReferees(api) : undefinedNoop,
    {
      enabled: !!referrerAddress,
      select: (data) =>
        data?.filter(({ referrer }) => referrer === referrerAddress),
    },
  )
}

const getReferees = (api: ApiPromise) => async () => {
  const rawData = await api.query.referrals.linkedAccounts.entries()

  const data = rawData.map(([rawCode, address]) => {
    const [referee] = rawCode.toHuman() as string[]

    return {
      referrer: address.toString(),
      referee,
    }
  })

  return data
}

export const useRegistrationLinkFee = (disabled?: boolean) => {
  const { api, isLoaded } = useRpcProvider()
  const { getAsset } = useAssets()

  return useQuery(
    QUERY_KEYS.referralLinkFee,
    !disabled
      ? async () => {
          const rawData = await api.consts.referrals.registrationFee

          const [id, amount] = rawData ?? []

          const feeAssetId = id?.toString()
          const feeAmount = amount?.toBigNumber()
          const meta = getAsset(feeAssetId)

          if (feeAssetId && feeAmount && meta) {
            const amount = feeAmount.shiftedBy(-meta.decimals)

            return {
              id: feeAssetId,
              amount,
              decimals: meta.decimals,
              symbol: meta.symbol,
            }
          }
        }
      : undefinedNoop,
    { enabled: !disabled && isLoaded },
  )
}
