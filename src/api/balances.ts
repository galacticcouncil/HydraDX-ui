import { NATIVE_ASSET_ID, useApiPromise } from "utils/api"

import BigNumber from "bignumber.js"
import { ApiPromise } from "@polkadot/api"
import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { Maybe, undefinedNoop } from "utils/helpers"
import { useAccountStore } from "state/store"
import { BN_0 } from "utils/constants"

function calculateFreeBalance(
  free: BigNumber,
  miscFrozen: BigNumber,
  feeFrozen: BigNumber,
) {
  const maxFrozenBalance = miscFrozen.gt(feeFrozen) ? miscFrozen : feeFrozen
  return free.minus(maxFrozenBalance)
}

export const getTokenBalance =
  (api: ApiPromise, account: AccountId32 | string, id: string | u32) =>
  async () => {
    if (id.toString() === NATIVE_ASSET_ID) {
      const res = await api.query.system.account(account)
      const freeBalance = new BigNumber(res.data.free.toHex())
      const miscFrozenBalance = new BigNumber(res.data.miscFrozen.toHex())
      const feeFrozenBalance = new BigNumber(res.data.feeFrozen.toHex())
      const reservedBalance = new BigNumber(res.data.reserved.toHex())

      const balance = new BigNumber(
        calculateFreeBalance(
          freeBalance,
          miscFrozenBalance,
          feeFrozenBalance,
        ) ?? NaN,
      )

      return {
        accountId: account,
        assetId: id,
        balance,
        total: freeBalance.plus(reservedBalance),
        freeBalance,
        reservedBalance,
      }
    }

    const res = await api.query.tokens.accounts(account, id)

    const freeBalance = new BigNumber(res.free.toHex())
    const reservedBalance = new BigNumber(res.reserved.toHex())
    const frozenBalance = new BigNumber(res.frozen.toHex())
    const balance = new BigNumber(
      calculateFreeBalance(freeBalance, BN_0, frozenBalance) ?? NaN,
    )

    return {
      accountId: account,
      assetId: id,
      balance,
      total: freeBalance.plus(reservedBalance),
      freeBalance,
    }
  }

export const useTokenBalance = (
  id: Maybe<string | u32>,
  address: Maybe<AccountId32 | string>,
) => {
  const api = useApiPromise()

  return useQuery(
    QUERY_KEYS.tokenBalance(id, address),
    address != null && id != null
      ? getTokenBalance(api, address, id)
      : undefinedNoop,
    { enabled: address != null && id != null },
  )
}

export function useTokensBalances(
  tokenIds: (string | u32)[],
  address: Maybe<AccountId32 | string>,
  noRefresh?: boolean,
) {
  const api = useApiPromise()

  return useQueries({
    queries: tokenIds.map((id) => ({
      queryKey: noRefresh
        ? QUERY_KEYS.tokenBalance(id, address)
        : QUERY_KEYS.tokenBalanceLive(id, address),
      queryFn:
        address != null ? getTokenBalance(api, address, id) : undefinedNoop,
      enabled: !!id && !!address,
    })),
  })
}

const getExistentialDeposit = (api: ApiPromise) => {
  return api.consts.balances.existentialDeposit
}

export function useExistentialDeposit() {
  const api = useApiPromise()
  return useQuery(QUERY_KEYS.existentialDeposit, async () => {
    const existentialDeposit = await getExistentialDeposit(api)
    return existentialDeposit.toBigNumber()
  })
}

export const useTokensLocks = (ids: Maybe<u32 | string>[]) => {
  const api = useApiPromise()
  const { account } = useAccountStore()

  const normalizedIds = ids?.reduce<string[]>((memo, item) => {
    if (item != null) memo.push(item.toString())
    return memo
  }, [])

  return useQueries({
    queries: normalizedIds?.map((id) => ({
      queryKey: QUERY_KEYS.lock(account?.address, id),
      queryFn:
        account?.address != null
          ? getTokenLock(api, account.address, id)
          : undefinedNoop,
      enabled: !!account?.address,
    })),
  })
}

export const useTokenLocks = (id: Maybe<u32 | string>) => {
  const api = useApiPromise()
  const { account } = useAccountStore()

  return useQuery(
    QUERY_KEYS.lock(account?.address, id),
    account?.address != null
      ? getTokenLock(api, account.address, id?.toString() ?? "")
      : undefinedNoop,
    { enabled: !!account?.address && !!id },
  )
}

export const getTokenLock =
  (api: ApiPromise, address: AccountId32 | string, id: string) => async () => {
    if (id === NATIVE_ASSET_ID) {
      const res = await api.query.balances.locks(address)
      return res.map((lock) => ({
        id: id,
        amount: lock.amount.toBigNumber(),
        type: lock.id.toHuman(),
      }))
    }

    const res = await api.query.tokens.locks(address, id)
    return res.map((lock) => ({
      id: id,
      amount: lock.amount.toBigNumber(),
      type: lock.id.toString(),
    }))
  }
