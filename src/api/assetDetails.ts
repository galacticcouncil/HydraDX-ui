import { AccountId32 } from "@polkadot/types/interfaces"
import { Maybe } from "utils/helpers"
import { useAccountBalances } from "./accountBalances"
import { useAssets } from "providers/assets"

export const useAcountAssets = (address: Maybe<AccountId32 | string>) => {
  const { getAssetWithFallback, native } = useAssets()
  const accountBalances = useAccountBalances(address, true)

  if (!accountBalances.data) return []

  const tokenBalances = accountBalances.data?.balances
    ? accountBalances.data.balances.map((balance) => {
        const asset = getAssetWithFallback(balance.id)

        return { asset, balance }
      })
    : []
  if (accountBalances.data?.native)
    tokenBalances.unshift({
      balance: accountBalances.data.native,
      asset: native,
    })

  return tokenBalances
}
