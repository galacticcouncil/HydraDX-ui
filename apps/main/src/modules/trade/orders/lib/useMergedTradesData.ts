import { useMemo } from "react"

import { PastExecutionData } from "@/modules/trade/orders/lib/types"
import { useIntentTradesData } from "@/modules/trade/orders/lib/useIntentTradesData"
import { useOrderTradesData } from "@/modules/trade/orders/lib/useOrderTradesData"
import { TAsset } from "@/providers/assetsProvider"
import { chronologicallyDesc, sortBy } from "@/utils/sort"

export const useMergedTradesData = (
  scheduleId: number,
  intentId: bigint,
  from: TAsset,
  to: TAsset,
) => {
  const { executions: scheduleExecutions, isLoading: isScheduleLoading } =
    useOrderTradesData(scheduleId, from, to)

  const { executions: intentExecutions, isLoading: isIntentLoading } =
    useIntentTradesData(intentId, from, to)

  const executions = useMemo<ReadonlyArray<PastExecutionData>>(
    () =>
      [...scheduleExecutions, ...intentExecutions].sort(
        sortBy({
          select: (execution) => execution.timestamp ?? new Date(0),
          compare: chronologicallyDesc,
        }),
      ),
    [scheduleExecutions, intentExecutions],
  )

  return { executions, isLoading: isScheduleLoading || isIntentLoading }
}
