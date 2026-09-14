import { dcaSchedulesQuery } from "@galacticcouncil/indexer/neckwork"
import { safeConvertSS58toPublicKey } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useMemo } from "react"

import { neckworkClient } from "@/api/neckwork"
import { toApiDcaStatuses } from "@/modules/trade/orders/lib/apiVocabulary"
import {
  DcaOrderData,
  OrderKind,
  toOrderStatusFromSchedule,
} from "@/modules/trade/orders/lib/orderData"
import { DcaScheduleStatus } from "@/modules/trade/orders/lib/types"
import { useNeckworkTradeQueriesEnabled } from "@/modules/trade/swap/tradeDataSource"
import { useAssets } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

export const useHistoryData = (
  statuses: ReadonlyArray<DcaScheduleStatus>,
  assetIds: Array<string>,
  page: number,
  pageSize: number,
) => {
  const { account } = useAccount()
  const accountAddress = account?.address ?? ""
  const owner = safeConvertSS58toPublicKey(accountAddress)
  const neckworkEnabled = useNeckworkTradeQueriesEnabled()

  const { data, isLoading } = useQuery({
    ...dcaSchedulesQuery(neckworkClient, {
      owner,
      statuses: toApiDcaStatuses(statuses),
      assetIds,
      page,
      pageSize,
    }),
    enabled: neckworkEnabled && !!owner,
    placeholderData: keepPreviousData,
  })

  const { getAssetWithFallback } = useAssets()

  const totalCount = data?.totalCount ?? 0
  const orders = useMemo<Array<DcaOrderData>>(
    () =>
      data?.items.map<DcaOrderData>((schedule) => {
        const from = getAssetWithFallback(schedule.assetIn)
        const to = getAssetWithFallback(schedule.assetOut)

        const fromAmountBudget = scaleHuman(schedule.budget, from.decimals)
        const fromAmountExecuted = scaleHuman(
          schedule.executedAmountIn,
          from.decimals,
        )

        return {
          kind: schedule.isRollingBudget ? OrderKind.DcaRolling : OrderKind.Dca,
          scheduleId: schedule.scheduleId,
          from,
          fromAmountBudget,
          fromAmountExecuted,
          fromAmountRemaining: Big(fromAmountBudget)
            .minus(fromAmountExecuted)
            .toString(),
          singleTradeSize: scaleHuman(
            schedule.singleTradeAmount,
            from.decimals,
          ),
          to,
          toAmountExecuted: scaleHuman(schedule.executedAmountOut, to.decimals),
          status: toOrderStatusFromSchedule(
            schedule.status as DcaScheduleStatus,
          ),
          timestamp: schedule.lastEventAt ?? schedule.createdAt,
          blocksPeriod: String(schedule.periodBlocks),
          isOpenBudget: schedule.isRollingBudget,
          limitPrice: null,
        }
      }) ?? [],
    [data, getAssetWithFallback],
  )

  return { orders, totalCount, isLoading }
}
