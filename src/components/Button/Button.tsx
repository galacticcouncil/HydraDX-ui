import { ComponentProps, forwardRef } from "react"
import { SButton, SButtonTransparent, SContent } from "./Button.styled"
import { Spinner } from "components/Spinner/Spinner"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "mutedSecondary"
  | "error"
  | "mutedError"
  | "warning"
  | "gradient"
  | "outline"
  | "transparent"
  | "blue"
  | "green"
export type ButtonSize = "small" | "medium" | "compact" | "micro"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  text?: string
  isLoading?: boolean
  children?: React.ReactNode
  active?: boolean
  transform?: "uppercase" | "lowercase" | "none"
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "medium",
  ...props
}) => {
  return (
    <SButton variant={variant} size={size} {...props}>
      <SContent size={size}>
        {props.isLoading && <Spinner size={size === "small" ? 12 : 16} />}
        {props.text || props.children}
      </SContent>
    </SButton>
  )
}

export const ButtonTransparent = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof SButtonTransparent>
>((props, ref) => {
  return <SButtonTransparent ref={ref} type="button" {...props} />
})
