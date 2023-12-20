import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { useRpcProvider } from "providers/rpcProvider"
import { QUERY_KEYS } from "utils/queryKeys"
import { u32 } from "@polkadot/types"
import { undefinedNoop } from "utils/helpers"

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
    const rawDara = (await api.consts.referrals.codeLength) as u32

    return rawDara.toBigNumber()
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