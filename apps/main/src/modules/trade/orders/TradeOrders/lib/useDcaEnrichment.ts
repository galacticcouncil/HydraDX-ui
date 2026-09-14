import { dcaSchedulesQuery } from "@galacticcouncil/indexer/neckwork"
import { safeConvertSS58toPublicKey } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useMemo } from "react"

import { neckworkClient } from "@/api/neckwork"
import { toApiDcaStatuses } from "@/modules/trade/orders/lib/apiVocabulary"
import { DcaOrderData } from "@/modules/trade/orders/lib/orderData"
import { DCA_OPEN_ORDER_STATUSES } from "@/modules/trade/orders/lib/types"
import { scaleHuman } from "@/utils/formatting"

const PAGE_SIZE = 100

export const useDcaEnrichment = (orders: Array<DcaOrderData>) => {
  const { account } = useAccount()
  const owner = safeConvertSS58toPublicKey(account?.address ?? "")

  // no polling here - useNeckworkSync invalidates the account subtree once the
  // indexer catches up with the user's latest tx
  const { data, refetch } = useQuery(
    dcaSchedulesQuery(neckworkClient, {
      owner,
      statuses: toApiDcaStatuses(DCA_OPEN_ORDER_STATUSES),
      assetIds: [],
      page: 0,
      pageSize: PAGE_SIZE,
    }),
  )

  const enrichment = useMemo(
    () =>
      new Map(
        (data?.items ?? []).map((schedule) => [
          schedule.scheduleId,
          {
            executedAmountIn: schedule.executedAmountIn,
            executedAmountOut: schedule.executedAmountOut,
          },
        ]),
      ),
    [data],
  )

  const enriched = useMemo(
    () =>
      orders.map((order) => {
        const executed = enrichment.get(order.scheduleId)
        if (!executed) return order

        const indexerIn = scaleHuman(
          executed.executedAmountIn,
          order.from.decimals,
        )
        const indexerOut = scaleHuman(
          executed.executedAmountOut,
          order.to.decimals,
        )
        const fromAmountExecuted = Big.max(
          order.fromAmountExecuted ?? 0,
          indexerIn,
        ).toString()

        return {
          ...order,
          fromAmountExecuted,
          fromAmountRemaining:
            order.isOpenBudget || order.fromAmountBudget === null
              ? order.fromAmountRemaining
              : Big.max(
                  0,
                  Big(order.fromAmountBudget).minus(fromAmountExecuted),
                ).toString(),
          toAmountExecuted: Big(indexerOut).gt(0)
            ? indexerOut
            : order.toAmountExecuted,
        }
      }),
    [orders, enrichment],
  )

  return { orders: enriched, refetch }
}
