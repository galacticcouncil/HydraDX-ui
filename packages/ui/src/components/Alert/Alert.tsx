import { ComponentType, FC, ReactNode } from "react"

import {
  CircleCheck,
  CircleInfo,
  ExclamationMark,
  TriangleAlert,
} from "@/assets/icons"
import {
  AlertVariant,
  SAlertContainer,
  SAlertIcon,
  SAlertTitle,
} from "@/components/Alert/Alert.styled"
import { Flex } from "@/components/Flex"
import { Text } from "@/components/Text"
import { Tooltip } from "@/components/Tooltip"
import { getToken } from "@/utils"

export type AlertProps = {
  readonly variant?: AlertVariant
  readonly title?: string
  readonly description?: ReactNode
  readonly action?: ReactNode
  readonly className?: string
  readonly displayIcon?: boolean
  readonly tooltip?: string
}

export const Alert: FC<AlertProps> = ({
  variant = "info",
  title,
  description,
  action,
  className,
  displayIcon = true,
  tooltip,
}) => {
  return (
    <SAlertContainer
      variant={variant}
      hasDescription={!!description}
      className={className}
    >
      {displayIcon && (
        <SAlertIcon
          variant={variant}
          size="s"
          component={alertIcons[variant]}
        />
      )}

      <Flex direction="column" gap="base" align="baseline">
        <Tooltip text={tooltip}>
          {title && <SAlertTitle variant={variant}>{title}</SAlertTitle>}
          {typeof description === "string" ? (
            <Text fw={500} fs="p4" lh={1.3} color={getToken("text.high")}>
              {description}
            </Text>
          ) : (
            description
          )}
        </Tooltip>
        {action}
      </Flex>
    </SAlertContainer>
  )
}

const alertIcons: Record<AlertVariant, ComponentType> = {
  info: CircleInfo,
  warning: TriangleAlert,
  error: ExclamationMark,
  success: CircleCheck,
}
