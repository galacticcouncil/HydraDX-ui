import { intentEventsQuery } from "@galacticcouncil/indexer/indexer"
import { neckwork } from "@galacticcouncil/utils"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useIndexerClient } from "@/api/indexer"
import { TransactionStatusVariant } from "@/components/TransactionItem/TransactionStatus.styled"
import { PastExecutionData } from "@/modules/trade/orders/lib/types"
import { TAsset } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

type IntentExecutionArgs = {
  readonly id: string | number
  readonly amountIn?: string
  readonly amountOut?: string
}

const INTENT_EXECUTION_EVENTS = [
  "Intent.DcaTradeExecuted",
  "Intent.IntentResovedPartially",
  "Intent.IntentResolved",
]

export const useIntentTradesData = (
  intentId: bigint,
  from: TAsset,
  to: TAsset,
) => {
  const indexerSdk = useIndexerClient()

  const ids = useMemo(() => [String(intentId)], [intentId])

  const { data, isLoading } = useQuery(intentEventsQuery(indexerSdk, ids))

  const executions = useMemo<ReadonlyArray<PastExecutionData>>(() => {
    return (
      data?.events
        .filter((event) => INTENT_EXECUTION_EVENTS.includes(event.name))
        .map<PastExecutionData>((event) => {
          const args = event.args as IntentExecutionArgs | null

          const timestamp = event.block.timestamp
            ? new Date(event.block.timestamp)
            : null

          return {
            id: `${event.block.height}-${args?.id ?? intentId}-${event.name}`,
            status: TransactionStatusVariant.Success,
            amountIn: scaleHuman(args?.amountIn || "0", from.decimals),
            amountOut: scaleHuman(args?.amountOut || "0", to.decimals),
            timestamp,
            link: neckwork.block(event.block.height),
            errorState: null,
          }
        }) ?? []
    )
  }, [data, intentId, from.decimals, to.decimals])

  return { executions, isLoading }
}
