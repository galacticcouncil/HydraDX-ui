import { FC } from "react"

import { useIntentTradesData } from "@/modules/trade/orders/lib/useIntentTradesData"
import { PastExecutions } from "@/modules/trade/orders/PastExecutions/PastExecutions"
import { PastExecutionsModalSection } from "@/modules/trade/orders/PastExecutions/PastExecutionsModalSection"
import { TAsset } from "@/providers/assetsProvider"

type Props = {
  readonly intentId: bigint
  readonly assetIn: TAsset
  readonly assetOut: TAsset
  readonly className?: string
}

export const PastExecutionsIntent: FC<Props> = ({
  intentId,
  assetIn,
  assetOut,
  className,
}) => {
  const { executions, isLoading } = useIntentTradesData(
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
