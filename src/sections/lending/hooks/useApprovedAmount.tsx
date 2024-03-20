import { useQuery } from "@tanstack/react-query"
import { useRootStore } from "sections/lending/store/root"
import { MarketDataType } from "sections/lending/ui-config/marketsConfig"
import { queryKeysFactory } from "sections/lending/ui-config/queries"
import { useSharedDependencies } from "sections/lending/ui-config/SharedDependenciesProvider"

export const useApprovedAmount = ({
  marketData,
  token,
  spender,
}: {
  marketData: MarketDataType
  user: string
  token: string
  spender: string
}) => {
  const { approvedAmountService } = useSharedDependencies()
  const user = useRootStore((store) => store.account)
  return useQuery({
    queryFn: () =>
      approvedAmountService.getApprovedAmount(marketData, user, token, spender),
    queryKey: queryKeysFactory.approvedAmount(user, token, spender, marketData),
    enabled: !!user,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const usePoolApprovedAmount = (
  marketData: MarketDataType,
  token: string,
) => {
  const { approvedAmountService } = useSharedDependencies()
  const user = useRootStore((store) => store.account)
  return useQuery({
    queryFn: () =>
      approvedAmountService.getPoolApprovedAmount(marketData, user, token),
    queryKey: queryKeysFactory.poolApprovedAmount(user, token, marketData),
    enabled: !!user,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
