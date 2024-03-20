import { FC } from "react"
import { Alert, AlertProps } from "components/Alert"

export const Warning: FC<AlertProps> = ({ children, className, variant }) => {
  return (
    <Alert className={className} variant={variant}>
      {children}
    </Alert>
  )
}
