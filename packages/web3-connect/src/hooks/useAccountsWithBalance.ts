import { useEffect, useMemo } from "react"
import { pick, sortBy } from "remeda"
import { useShallow } from "zustand/shallow"

import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useAccount } from "@/hooks"
import { useAccountBalancesMap } from "@/hooks/useAccountBalancesMap"
import { Account, useWeb3Connect } from "@/hooks/useWeb3Connect"

export const useAccountsWithBalance = (accounts: Account[]) => {
  const { account: currentAccount } = useAccount()
  const { neckwork } = useWeb3ConnectContext()
  const { setBalances } = useWeb3Connect(
    useShallow(pick(["accounts", "setBalances"])),
  )

  const { balancesMap, isLoading: areBalancesLoading } = useAccountBalancesMap({
    accounts,
    neckwork,
  })

  useEffect(() => {
    if (!areBalancesLoading) {
      setBalances(balancesMap)
    }
  }, [balancesMap, areBalancesLoading, setBalances])

  const accountsWithBalances = useMemo(() => {
    const accountsWithActive = accounts.map((account) => {
      const isActive =
        currentAccount?.address === account.address &&
        currentAccount?.provider === account.provider

      return {
        ...account,
        isActive,
      }
    })

    return sortBy(
      accountsWithActive,
      [(item) => item.isActive, "desc"],
      [(item) => item.balance === undefined, "desc"],
      [(item) => item.balance ?? 0, "desc"],
    )
  }, [accounts, currentAccount?.address, currentAccount?.provider])

  return {
    accountsWithBalances,
    areBalancesLoading,
  }
}
