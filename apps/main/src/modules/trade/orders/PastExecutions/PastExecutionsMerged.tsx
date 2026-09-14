import { FC } from "react"

import { useMergedTradesData } from "@/modules/trade/orders/lib/useMergedTradesData"
import { PastExecutions } from "@/modules/trade/orders/PastExecutions/PastExecutions"
import { PastExecutionsModalSection } from "@/modules/trade/orders/PastExecutions/PastExecutionsModalSection"
import { TAsset } from "@/providers/assetsProvider"

type Props = {
  readonly scheduleId: number
  readonly intentId: bigint
  readonly assetIn: TAsset
  readonly assetOut: TAsset
  readonly className?: string
}

export const PastExecutionsMerged: FC<Props> = ({
  scheduleId,
  intentId,
  assetIn,
  assetOut,
  className,
}) => {
  const { executions, isLoading } = useMergedTradesData(
    scheduleId,
    intentId,
    assetIn,
    assetOut,
  )

  return (
    <PastExecutionsModalSection executions={executions} isLoading={isLoading}>
      <PastExecutions
        assetIn={assetIn}
        assetOut={assetOut}
        executions={executions}
        isLoading={isLoading}
        className={className}
      />
    </PastExecutionsModalSection>
  )
}
