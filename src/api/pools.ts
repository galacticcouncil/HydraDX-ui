import { useMemo } from "react"
import { useTotalIssuances } from "./totalIssuance"
import { useTokensBalances } from "./balances"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useRpcProvider } from "providers/rpcProvider"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"

export const useShareOfPools = (assets: string[]) => {
  const { account } = useAccount()

  const totalIssuances = useTotalIssuances(assets)
  const totalBalances = useTokensBalances(assets, account?.address)

  const queries = [...totalIssuances, ...totalBalances]
  const isLoading = queries.some((query) => query.isInitialLoading)

  const data = useMemo(() => {
    if (!!totalIssuances.length && !!totalBalances.length) {
      return assets.map((asset) => {
        const totalBalance = totalBalances.find(
          (balance) => balance.data?.assetId === asset,
        )
        const totalIssuance = totalIssuances.find(
          (issuance) => issuance.data?.token === asset,
        )

        const calculateTotalShare = () => {
          if (totalBalance?.data && totalIssuance?.data) {
            return totalBalance.data.total
              .div(totalIssuance.data.total)
              .multipliedBy(100)
          }
          return null
        }

        const calculateTransferableShare = () => {
          if (totalBalance?.data && totalIssuance?.data) {
            return totalBalance.data.balance
              .div(totalIssuance.data.total)
              .multipliedBy(100)
          }
          return null
        }

        return {
          asset,
          totalShare: totalIssuance?.data?.total,
          myPoolShare: calculateTotalShare(),
          transferableShare: calculateTransferableShare(),
        }
      })
    }

    return null
  }, [assets, totalIssuances, totalBalances])

  return { isLoading, isInitialLoading: isLoading, data }
}

export const useSDKPools = () => {
  const { isLoaded, tradeRouter } = useRpcProvider()

  return useQuery({
    queryKey: QUERY_KEYS.pools,
    queryFn: async () => {
      return await tradeRouter.getPools()
    },
    enabled: isLoaded,
  })
}
