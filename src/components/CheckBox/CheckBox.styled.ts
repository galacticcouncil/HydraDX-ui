import styled from "@emotion/styled"
import { CheckboxSize, CheckboxVariant } from "./CheckBox"
import { theme } from "theme"
import { css } from "@emotion/react"

const getVariantStyles = (variant: CheckboxVariant) => {
  switch (variant) {
    case "primary":
      return css`
        & > span {
          background: ${theme.colors.pink700};
        }
      `
    case "secondary":
      return css`
        & > span {
          background: ${theme.colors.brightBlue600};
        }
      `
  }
}

const getSizeStyles = (size: CheckboxSize) => {
  switch (size) {
    case "small":
      return css`
        width: 16px;
        height: 16px;
        border-radius: 4px;
        & > span {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
      `
    case "medium":
      return css`
        width: 28px;
        height: 28px;
        border-radius: 8px;
        & > span {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }
      `
    case "large":
      return css`
        width: 36px;
        height: 36px;
        border-radius: 8px;
        & > span {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
      `
  }
}

export const SContainer = styled.label`
  display: flex;
  align-items: start;
  cursor: pointer;
  gap: 6px;
  color: currentColor;
`

export const SOuter = styled.div<{
  size: CheckboxSize
  variant: CheckboxVariant
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: 0;
  flex-shrink: 0;

  border: 1px solid ${theme.colors.darkBlue300};

  ${({ size }) => getSizeStyles(size)}
  ${({ variant }) => getVariantStyles(variant)}

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;

    ~ span {
      display: none;
    }

    &:checked ~ span {
      display: block;
    }

    &:disabled ~ span {
      opacity: 0.5;
      background: ${theme.colors.darkBlue300};
    }
  }
`
