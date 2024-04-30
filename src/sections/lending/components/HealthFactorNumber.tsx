import { valueToBigNumber } from "@aave/math-utils"
import BigNumber from "bignumber.js"
import { theme } from "theme"

import { Button } from "components/Button/Button"
import { getHealthFactorColor } from "sections/lending/utils/utils"

type HealthFactorNumberProps = {
  value: string
  onInfoClick?: () => void
}

export const HealthFactorNumber = ({
  value,
  onInfoClick,
}: HealthFactorNumberProps) => {
  const formattedHealthFactor = Number(
    valueToBigNumber(value).toFixed(2, BigNumber.ROUND_DOWN),
  )
  const healthFactorColor = getHealthFactorColor(value)

  return (
    <div
      sx={{
        flex: "row",
        gap: 10,
      }}
    >
      {value === "-1" ? (
        <span sx={{ color: theme.colors.green400 }}>∞</span>
      ) : (
        <span css={{ color: healthFactorColor }}>{formattedHealthFactor}</span>
      )}

      {onInfoClick && (
        <Button
          css={{
            color: healthFactorColor,
            borderColor: "currentColor",
            background: "transparent",
          }}
          size="micro"
          onClick={onInfoClick}
        >
          Risk Details
        </Button>
      )}
    </div>
  )
}
