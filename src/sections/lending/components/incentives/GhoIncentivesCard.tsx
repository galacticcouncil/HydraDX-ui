import { Box, Tooltip, Typography, TypographyProps } from "@mui/material"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"

import { PopperComponent } from "sections/lending/components/ContentWithTooltip"
import GhoBorrowApyRange from "sections/lending/components/GhoBorrowApyRange"
import { FormattedNumber } from "sections/lending/components/primitives/FormattedNumber"
import { Link } from "sections/lending/components/primitives/Link"
import { NoData } from "sections/lending/components/primitives/NoData"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"

export interface GhoIncentivesCardProps {
  value: string | number
  useApyRange?: boolean
  rangeValues?: [number, number]
  stkAaveBalance: string | number
  ghoRoute: string
  userQualifiesForDiscount: boolean
  onMoreDetailsClick?: () => void
  withTokenIcon?: boolean
  forceShowTooltip?: boolean
  variant?: TypographyProps["variant"]
  color?: TypographyProps["color"]
}

export const GhoIncentivesCard = ({
  value,
  useApyRange,
  rangeValues = [0, 0],
  ghoRoute,
  stkAaveBalance,
  userQualifiesForDiscount,
  onMoreDetailsClick,
  withTokenIcon = false,
  forceShowTooltip = false,
  variant = "secondary14",
  color = undefined,
}: GhoIncentivesCardProps) => {
  const { ghoReserveData } = useAppDataContext()
  const stkAaveAmount = Number(stkAaveBalance)

  const minStkAaveBalanceReached =
    stkAaveAmount >= ghoReserveData.ghoMinDiscountTokenBalanceForDiscount

  let toolTipContent = <></>
  const showTooltip = userQualifiesForDiscount || forceShowTooltip
  if (showTooltip) {
    toolTipContent = (
      <Box
        sx={{
          py: 4,
          px: 6,
          fontSize: "12px",
          lineHeight: "16px",
          a: {
            fontSize: "12px",
            lineHeight: "16px",
            fontWeight: 500,
          },
        }}
      >
        <Typography variant="subheader2">
          <span>
            Estimated compounding interest, including discount for Staking{" "}
            {minStkAaveBalanceReached ? (
              <>
                <FormattedNumber
                  variant="subheader2"
                  value={stkAaveAmount}
                  visibleDecimals={2}
                />{" "}
              </>
            ) : null}
            AAVE in Safety Module.
          </span>{" "}
          <Link
            onClick={onMoreDetailsClick}
            href={ghoRoute}
            underline="always"
            variant="subheader2"
          >
            <span>Learn more</span>
          </Link>
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: { xs: "flex-end", xsm: "center" },
        justifyContent: "center",
        textAlign: "center",
        flex: "2 1 auto",
      }}
    >
      {value.toString() !== "-1" ? (
        <Tooltip
          enterTouchDelay={0}
          leaveTouchDelay={0}
          placement="top"
          title={toolTipContent}
          arrow={showTooltip}
          PopperComponent={PopperComponent}
        >
          <Box
            sx={() => ({
              display: "flex",
              alignItems: "center",
            })}
          >
            {withTokenIcon && (
              <TokenIcon
                symbol="stkAAVE"
                sx={{ height: 14, width: 14, mr: 16 }}
              />
            )}
            {useApyRange ? (
              <GhoBorrowApyRange
                percentVariant={variant}
                hyphenVariant={variant}
                minVal={Math.min(...rangeValues)}
                maxVal={Math.max(...rangeValues)}
                color={color}
              />
            ) : (
              <FormattedNumber
                value={value}
                percent
                variant={variant}
                color={color}
                data-cy={"apy"}
              />
            )}
          </Box>
        </Tooltip>
      ) : (
        <NoData variant="secondary14" color="text.secondary" />
      )}
    </Box>
  )
}
