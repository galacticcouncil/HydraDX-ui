import styled from "@emotion/styled"
import { theme } from "theme"

export const SInput = styled.input<{ error?: string }>`
  all: unset;
  color: currentColor;

  width: 100%;

  transition: ${theme.transitions.default};

  ::placeholder {
    color: ${theme.colors.basic300};
  }

  :focus-visible {
    outline: none;
  }
`

export const SInputWrapper = styled.div<{
  disabled?: boolean
}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;

  min-width: 0;
  width: 100%;

  color: ${({ disabled }) =>
    disabled ? theme.colors.basic600 : theme.colors.white};

  font-size: 14px;
  padding: 5px 0 5px 10px;
`

export const SErrorMessage = styled.p`
  color: ${theme.colors.error};
  font-size: 12px;
  line-height: 16px;
  margin-top: 2px;
`
