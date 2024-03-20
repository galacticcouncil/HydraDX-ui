import { CircularProgress } from "components/Progress"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { Text } from "components/Typography/Text/Text"
import { ComponentPropsWithoutRef, ReactNode } from "react"
import { useMedia } from "react-use"
import { theme } from "theme"

type ProgressColor = ComponentPropsWithoutRef<typeof CircularProgress>["color"]

type CapsCircularStatusProps = {
  value: number
  tooltipContent: ReactNode
  onClick?: (open: boolean) => void
  color?: ProgressColor
}

export const CapsCircularStatus = ({
  value,
  tooltipContent,
  color = "green600",
}: CapsCircularStatusProps) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)

  // If value is zero, don't show anything
  if (value === 0) return null

  const determineColor = (): ProgressColor => {
    if (Math.round(value) >= 99.99) {
      return "red400"
    } else if (value >= 98) {
      return "warning300"
    } else {
      return color
    }
  }

  const determineValueDisplay = (): string => {
    if (value >= 99.99) {
      return "100%"
    } else if (value === 0) {
      return "N/A"
    } else if (value < 0.01) {
      return "<0.01%"
    } else {
      return `${value.toFixed(2)}%`
    }
  }

  return (
    <InfoTooltip text={tooltipContent} asChild>
      <CircularProgress
        color={determineColor()}
        radius={isDesktop ? 45 : 14}
        labelPosition={isDesktop ? "center" : "end"}
        thickness={3}
        // We show at minimum, 2% color to represent small values
        percent={value <= 2 ? 2 : value > 100 ? 100 : value}
      >
        <Text fs={[13, 16]}>{determineValueDisplay()}</Text>
      </CircularProgress>
    </InfoTooltip>
  )
}
