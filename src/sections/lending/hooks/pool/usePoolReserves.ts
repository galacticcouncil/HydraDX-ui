import { ReservesDataHumanized } from "@aave/contract-helpers"
import { useQueries, UseQueryOptions } from "@tanstack/react-query"
import { MarketDataType } from "sections/lending/ui-config/marketsConfig"
import {
  POLLING_INTERVAL,
  queryKeysFactory,
} from "sections/lending/ui-config/queries"
import { useSharedDependencies } from "sections/lending/ui-config/SharedDependenciesProvider"

import { HookOpts } from "sections/lending/hooks/commonTypes"

export const usePoolsReservesHumanized = <T = ReservesDataHumanized>(
  marketsData: MarketDataType[],
  opts?: HookOpts<ReservesDataHumanized, T>,
) => {
  const { uiPoolService } = useSharedDependencies()
  return useQueries({
    queries: marketsData.map(
      (marketData) =>
        ({
          queryKey: queryKeysFactory.poolReservesDataHumanized(marketData),
          queryFn: () => uiPoolService.getReservesHumanized(marketData),
          refetchInterval: POLLING_INTERVAL,
          meta: {},
          ...opts,
        }) as UseQueryOptions<ReservesDataHumanized, Error, T>,
    ),
  })
}

export const usePoolReservesHumanized = (marketData: MarketDataType) => {
  return usePoolsReservesHumanized([marketData])[0]
}
