import { ReserveIncentiveResponse } from "@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives"
import { ReactNode } from "react"
import { PercentageValue } from "components/PercentageValue"
import { NoData } from "sections/lending/components/primitives/NoData"
import { IncentivesButton } from "./IncentivesButton"

interface IncentivesCardProps {
  symbol: string
  value: string | number
  incentives?: ReserveIncentiveResponse[]
  tooltip?: ReactNode
}

export const IncentivesCard = ({
  symbol,
  value,
  incentives,
  tooltip,
}: IncentivesCardProps) => {
  const percentage = Number(value) * 100
  return (
    <>
      <div sx={{ mb: 1 }}>
        {value.toString() !== "-1" ? (
          <>
            <PercentageValue value={percentage} />
            {tooltip}
          </>
        ) : (
          <NoData />
        )}
      </div>
      <IncentivesButton incentives={incentives} symbol={symbol} />
    </>
  )
}
