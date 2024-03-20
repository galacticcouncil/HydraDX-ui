import { ReserveIncentiveResponse } from "@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives"

import { Box, Typography } from "@mui/material"

import { FormattedNumber } from "sections/lending/components/primitives/FormattedNumber"
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
  const typographyVariant = "secondary12"

  const Number = ({
    incentiveAPR,
  }: {
    incentiveAPR: "Infinity" | number | string
  }) => {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>
        {incentiveAPR !== "Infinity" ? (
          <>
            <FormattedNumber
              value={+incentiveAPR}
              percent
              variant={typographyVariant}
            />
            <Typography variant={typographyVariant} sx={{ ml: 4 }}>
              <span>APR</span>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant={typographyVariant}>∞ %</Typography>
            <Typography variant={typographyVariant} sx={{ ml: 4 }}>
              <span>APR</span>
            </Typography>
          </>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Typography variant="caption" color="text.secondary" mb={3}>
        <span>
          Participating in this {symbol} reserve gives annualized rewards.
        </span>
      </Typography>

      <Box sx={{ width: "100%" }}>
        {incentives.map((incentive) => (
          <Row
            height={32}
            caption={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: incentives.length > 1 ? 2 : 0,
                }}
              >
                <TokenIcon
                  symbol={incentive.rewardTokenSymbol}
                  sx={{ fontSize: "20px", mr: 16 }}
                />
                <Typography variant={typographyVariant}>
                  {incentive.rewardTokenSymbol}
                </Typography>
              </Box>
            }
            key={incentive.rewardTokenAddress}
            width="100%"
          >
            <Number incentiveAPR={incentive.incentiveAPR} />
          </Row>
        ))}

        {incentives.length > 1 && (
          <Box
            sx={(theme) => ({
              pt: 1,
              mt: 1,
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Row caption={<span>Net APR</span>} height={32}>
              <Number incentiveAPR={incentivesNetAPR} />
            </Row>
          </Box>
        )}
      </Box>
    </Box>
  )
}
