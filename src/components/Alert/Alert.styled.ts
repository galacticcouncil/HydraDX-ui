import styled from "@emotion/styled"
import { AlertSize, AlertVariant } from "./Alert"
import { theme } from "theme"

export const SContainer = styled.div<{
  variant: AlertVariant
  size: AlertSize
}>`
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr;

  border-radius: ${theme.borderRadius.default}px;

  ${({ size }) => {
    switch (size) {
      case "small":
        return { gap: 8, padding: "8px 10px" }
      case "medium":
        return { gap: 12, padding: "12px 14px" }
      case "large":
        return { gap: 16, padding: "16px" }
    }
  }}

  ${({ variant }) => {
    switch (variant) {
      case "error": {
        return { backgroundColor: `rgba(${theme.rgbColors.red100}, 0.25)` }
      }
      case "warning": {
        return { backgroundColor: `rgba(${theme.rgbColors.warning200}, 0.4)` }
      }
      case "info": {
        return {
          backgroundColor: `rgba(${theme.rgbColors.brightBlue100}, 0.2)`,
        }
      }
    }
  }}
`
