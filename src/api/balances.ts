import { NATIVE_ASSET_ID } from "utils/api"

import BigNumber from "bignumber.js"
import { ApiPromise } from "@polkadot/api"
import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { Maybe, undefinedNoop } from "utils/helpers"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useRpcProvider } from "providers/rpcProvider"

export function calculateFreeBalance(free: BigNumber, frozen: BigNumber) {
  return free.minus(frozen)
}

export const getTokenBalance =
  (api: ApiPromise, account: AccountId32 | string, id: string | u32) =>
  async () => {
    if (id.toString() === NATIVE_ASSET_ID) {
      const res = await api.query.system.account(account)
      const freeBalance = new BigNumber(res.data.free.toHex())
      const frozenBalance = new BigNumber(res.data.frozen.toHex())

      const reservedBalance = new BigNumber(res.data.reserved.toHex())

      const balance = freeBalance.minus(frozenBalance)

      return {
        accountId: account,
        assetId: id,
        balance,
        total: freeBalance.plus(reservedBalance),
        freeBalance,
      }
    }

    const res = await api.query.tokens.accounts(account, id)

    const freeBalance = new BigNumber(res.free.toHex())
    const reservedBalance = new BigNumber(res.reserved.toHex())
    const frozenBalance = new BigNumber(res.frozen.toHex())
    const balance = new BigNumber(
      calculateFreeBalance(freeBalance, frozenBalance) ?? NaN,
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
  options: { refetchInterval?: number } = {},
) => {
  const { api, isLoaded } = useRpcProvider()

  const enabled = !!id && !!address && isLoaded

  return useQuery(
    QUERY_KEYS.tokenBalance(id, address),
    enabled ? getTokenBalance(api, address, id) : undefinedNoop,
    { enabled, ...options },
  )
}

export function useTokensBalances(
  tokenIds: (string | u32)[],
  address: Maybe<AccountId32 | string>,
  noRefresh?: boolean,
) {
  const { api, isLoaded } = useRpcProvider()

  return useQueries({
    queries: tokenIds.map((id) => ({
      queryKey: noRefresh
        ? QUERY_KEYS.tokenBalance(id, address)
        : QUERY_KEYS.tokenBalanceLive(id, address),
      queryFn: address ? getTokenBalance(api, address, id) : undefinedNoop,
      enabled: !!id && !!address && isLoaded,
    })),
  })
}

const getExistentialDeposit = (api: ApiPromise) => {
  return api.consts.balances.existentialDeposit
}

export function useExistentialDeposit() {
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.existentialDeposit, async () => {
    const existentialDeposit = await getExistentialDeposit(api)
    return existentialDeposit.toBigNumber()
  })
}

export const useTokensLocks = (ids: Maybe<u32 | string>[]) => {
  const { api } = useRpcProvider()
  const { account } = useAccount()

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
  const { api } = useRpcProvider()
  const { account } = useAccount()

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

export const useShareTokenBalances = (shareTokenIds: string[]) => {
  const { api, assets } = useRpcProvider()

  const shareTokens = assets
    .getAssets(shareTokenIds)
    .reduce<{ id: string; address: string }[]>((acc, asset) => {
      if (assets.isShareToken(asset)) {
        asset.assets.forEach((id) =>
          acc.push({ id, address: asset.poolAddress }),
        )
      }

      return acc
    }, [])

  return useQueries({
    queries: shareTokens.map(({ id, address }) => ({
      queryKey: QUERY_KEYS.tokenBalanceLive(id, address),
      queryFn:
        address != null ? getTokenBalance(api, address, id) : undefinedNoop,
      enabled: !!id && !!address,
    })),
  })
}
