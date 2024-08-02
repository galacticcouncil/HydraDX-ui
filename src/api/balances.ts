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
) => {
  const { api } = useRpcProvider()

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
  const { api } = useRpcProvider()

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
  const { api } = useRpcProvider()
  return useQuery(QUERY_KEYS.existentialDeposit, async () => {
    const existentialDeposit = await getExistentialDeposit(api)
    return existentialDeposit.toBigNumber()
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
    const res =
      id === NATIVE_ASSET_ID
        ? await api.query.balances.locks(address)
        : await api.query.tokens.locks(address, id)

    return res.map((lock) => ({
      id: id,
      amount: lock.amount.toBigNumber(),
      type: lock.id.toHuman(),
    }))
  }
