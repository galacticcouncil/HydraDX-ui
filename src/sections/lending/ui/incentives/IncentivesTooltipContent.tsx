import { ReserveIncentiveResponse } from "@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives"
import { Text } from "components/Typography/Text/Text"
import { PercentageValue } from "components/PercentageValue"
import { Row } from "sections/lending/components/primitives/Row"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"

interface IncentivesTooltipContentProps {
  incentives: ReserveIncentiveResponse[]
  incentivesNetAPR: "Infinity" | number
  symbol: string
}

export const IncentivesTooltipContent = ({
  incentives,
  incentivesNetAPR,
  symbol,
}: IncentivesTooltipContentProps) => {
  const Number = ({
    incentiveAPR,
  }: {
    incentiveAPR: "Infinity" | number | string
  }) => {
    return (
      <div
        sx={{ display: "inline-flex", alignItems: "center", color: "white" }}
      >
        {incentiveAPR !== "Infinity" ? (
          <>
            <span>
              <PercentageValue value={+incentiveAPR * 100} />
            </span>
            <span sx={{ ml: 4 }}>APR</span>
          </>
        ) : (
          <>
            <span>∞ %</span>
            <span sx={{ ml: 4 }}>APR</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      sx={{
        flex: "column",
        justify: "center",
        align: "center",
        color: "white",
      }}
    >
      <Text fs={14} sx={{ mb: 12 }}>
        Participating in this {symbol} reserve gives annualized rewards.
      </Text>

      <div sx={{ width: "100%" }}>
        {incentives.map((incentive) => (
          <Row
            key={incentive.rewardTokenAddress}
            sx={{ fontSize: 12, mb: incentives.length > 1 ? 8 : 0 }}
            caption={
              <div
                sx={{
                  flex: "row",
                  align: "center",
                }}
              >
                <TokenIcon
                  symbol={incentive.rewardTokenSymbol}
                  sx={{ fontSize: "20px", mr: 4 }}
                />
                <span>{incentive.rewardTokenSymbol}</span>
              </div>
            }
          >
            <Number incentiveAPR={incentive.incentiveAPR} />
          </Row>
        ))}

        {incentives.length > 1 && (
          <div
            css={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
            sx={{
              pt: 12,
              mt: 12,
            }}
          >
            <Row caption="Net APR">
              <Number incentiveAPR={incentivesNetAPR} />
            </Row>
          </div>
        )}
      </div>
    </div>
  )
}
