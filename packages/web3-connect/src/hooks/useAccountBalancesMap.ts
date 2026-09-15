import {
  accountsBalancesQuery,
  NeckworkClient,
} from "@galacticcouncil/indexer/neckwork"
import { QueriesResults, useQueries } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { chunk } from "remeda"

type AccountWithPublicKey = {
  publicKey: string
}

type UseAccountBalancesMapOptions = {
  accounts: AccountWithPublicKey[]
  neckwork: NeckworkClient
  enabled?: boolean
}

export const useAccountBalancesMap = ({
  accounts,
  neckwork,
  enabled = true,
}: UseAccountBalancesMapOptions) => {
  const { accountBalances: balancesMap, isLoading } = useQueries({
    queries: enabled
      ? chunk(accounts, 50).map((batch) =>
          accountsBalancesQuery(
            neckwork,
            batch.map((account) => account.publicKey),
          ),
        )
      : [],
    combine: useCallback(
      (
        queries: QueriesResults<
          Array<ReturnType<typeof accountsBalancesQuery>>
        >,
      ) => {
        const isLoading = queries.some((query) => query.isLoading)
        const rows = queries.flatMap((query) => query.data ?? [])
        const lookup = new Map(rows.map((row) => [row.account, row.balance]))

        const accountBalances = isLoading
          ? new Map<string, number>()
          : new Map(
              accounts.map((account) => [
                account.publicKey,
                lookup.get(account.publicKey) ?? 0,
              ]),
            )

        return {
          isLoading,
          accountBalances,
        }
      },
      [accounts],
    ),
  })

  return useMemo(
    () => ({
      balancesMap,
      isLoading: enabled && isLoading,
    }),
    [balancesMap, enabled, isLoading],
  )
}
