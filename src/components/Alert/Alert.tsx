import ErrorIcon from "assets/icons/ErrorIcon.svg?react"
import WarningIcon from "assets/icons/WarningIcon.svg?react"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { Text } from "components/Typography/Text/Text"
import { FC, ReactNode } from "react"
import { SContainer } from "./Alert.styled"

export type AlertVariant = "warning" | "error" | "info"
export type AlertSize = "small" | "medium" | "large"

export type AlertProps = {
  className?: string
  variant: AlertVariant
  size?: AlertSize
  children?: ReactNode
}

export const Alert: FC<AlertProps> = ({
  variant,
  className,
  children,
  size = "medium",
}) => {
  const iconSize = getIconSize(size)
  return (
    <SContainer variant={variant} size={size} className={className}>
      {variant === "error" && <ErrorIcon width={iconSize} height={iconSize} />}
      {variant === "warning" && (
        <WarningIcon width={iconSize} height={iconSize} />
      )}
      {variant === "info" && (
        <SInfoIcon sx={{ width: iconSize, height: iconSize }} />
      )}

      <div sx={{ flex: "column", fontSize: getFontSize(size), lineHeight: 16 }}>
        {typeof children === "string" ? (
          <Text fs={getFontSize(size)} lh={16} fw={500}>
            {children}
          </Text>
        ) : (
          children
        )}
      </div>
    </SContainer>
  )
}

function getFontSize(size: AlertSize) {
  switch (size) {
    case "small":
      return 13
    case "medium":
      return 14
    case "large":
      return 16
  }
}

function getIconSize(size: AlertSize) {
  switch (size) {
    case "small":
      return 18
    case "medium":
      return 20
    case "large":
      return 24
  }
}
