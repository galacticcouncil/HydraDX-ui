import { FC, ReactNode } from "react"
import { SSeparator } from "./Separator.styled"
import { theme } from "theme"

export type SeparatorProps = {
  orientation?: "vertical" | "horizontal"
  color?: keyof typeof theme.colors
  opacity?: number
  size?: number
  children?: ReactNode
}

export const Separator: FC<SeparatorProps> = ({
  orientation = "horizontal",
  ...props
}) => <SSeparator orientation={orientation} {...props} />
