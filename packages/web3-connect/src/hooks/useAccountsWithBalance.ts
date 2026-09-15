import { AssetAmount } from "@galacticcouncil/xc-core"
import { QueriesResults, useQueries } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo } from "react"
import { partition, pick, sortBy } from "remeda"
import { useShallow } from "zustand/shallow"

import { SOLANA_PROVIDERS, SUI_PROVIDERS } from "@/config/providers"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useAccount } from "@/hooks"
import { useAccountBalancesMap } from "@/hooks/useAccountBalancesMap"
import { solanaNativeBalanceQueryOptions } from "@/hooks/useSolanaNativeBalance"
import { suiNativeBalanceQueryOptions } from "@/hooks/useSuiNativeBalance"
import { Account, useWeb3Connect } from "@/hooks/useWeb3Connect"

type NativeBalanceQueryOptions =
  | ReturnType<typeof solanaNativeBalanceQueryOptions>
  | ReturnType<typeof suiNativeBalanceQueryOptions>

/**
 * A public key can appear under several providers, so native balances are
 * keyed by provider and native address rather than by public key.
 */
const getNativeBalanceKey = (
  account: Pick<Account, "provider" | "rawAddress">,
) => `${account.provider}-${account.rawAddress}`

/**
 * Solana and Sui accounts have no Hydration balance to look up, so their
 * balance comes from the chain's native token instead of the indexer.
 */
const getNativeBalanceQueryOptions = (
  account: Account,
): NativeBalanceQueryOptions | null => {
  switch (true) {
    case SOLANA_PROVIDERS.includes(account.provider):
      return solanaNativeBalanceQueryOptions(account.rawAddress)
    case SUI_PROVIDERS.includes(account.provider):
      return suiNativeBalanceQueryOptions(account.rawAddress)
    default:
      return null
  }
}

const hasNativeBalance = (account: Account) =>
  SOLANA_PROVIDERS.includes(account.provider) ||
  SUI_PROVIDERS.includes(account.provider)

/**
 * Token amounts and fiat values are not comparable, so accounts are bucketed
 * before their balances are compared: the active account, then fiat-valued
 * accounts, then native-valued ones, then accounts with no balance at all.
 * Sorting by balance only ever happens within a bucket.
 */
const getSortRank = (account: {
  isActive: boolean
  balance: number | undefined
  balanceSymbol: string | undefined
}) => {
  if (account.isActive) return 0
  if (account.balance === undefined) return 3

  return account.balanceSymbol === undefined ? 1 : 2
}

export const useAccountsWithBalance = (accounts: Account[]) => {
  const { account: currentAccount } = useAccount()
  const { neckwork } = useWeb3ConnectContext()
  const { setBalances } = useWeb3Connect(
    useShallow(pick(["accounts", "setBalances"])),
  )

  const [nativeAccounts, fiatAccounts] = useMemo(
    () => partition(accounts, hasNativeBalance),
    [accounts],
  )

  const { balancesMap, isLoading: areFiatBalancesLoading } =
    useAccountBalancesMap({
      accounts: fiatAccounts,
      neckwork,
    })

  const { nativeBalancesMap, isLoading: areNativeBalancesLoading } = useQueries(
    {
      queries: nativeAccounts.flatMap(
        (account) => getNativeBalanceQueryOptions(account) ?? [],
      ),
      combine: useCallback(
        (queries: QueriesResults<Array<NativeBalanceQueryOptions>>) => {
          const nativeBalancesMap = new Map<string, AssetAmount>()

          nativeAccounts.forEach((account, index) => {
            const data = queries[index]?.data

            if (data) {
              nativeBalancesMap.set(getNativeBalanceKey(account), data)
            }
          })

          return {
            isLoading: queries.some((query) => query.isLoading),
            nativeBalancesMap,
          }
        },
        [nativeAccounts],
      ),
    },
  )

  useEffect(() => {
    if (!areFiatBalancesLoading) {
      setBalances(balancesMap)
    }
  }, [balancesMap, areFiatBalancesLoading, setBalances])

  const accountsWithBalances = useMemo(() => {
    const accountsWithActive = accounts.map((account) => {
      const isActive =
        currentAccount?.address === account.address &&
        currentAccount?.provider === account.provider

      const nativeBalance = nativeBalancesMap.get(getNativeBalanceKey(account))

      const balance = hasNativeBalance(account)
        ? nativeBalance?.toBig().toNumber()
        : account.balance

      return {
        ...account,
        isActive,
        balance,
        balanceSymbol: nativeBalance?.originSymbol,
      }
    })

    return sortBy(
      accountsWithActive,
      [getSortRank, "asc"],
      [(item) => item.balance ?? 0, "desc"],
    )
  }, [
    accounts,
    currentAccount?.address,
    currentAccount?.provider,
    nativeBalancesMap,
  ])

  return {
    accountsWithBalances,
    areBalancesLoading: areFiatBalancesLoading || areNativeBalancesLoading,
  }
}
