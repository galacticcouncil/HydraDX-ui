import styled from "@emotion/styled"
import { css } from "@emotion/react"
import { theme } from "theme"

export const SWrapper = styled.div<{
  unit: string | undefined
}>`
  position: relative;

  ${(p) =>
    p.unit &&
    css`
      &::after {
        content: ${`"${p.unit}"`};

        position: absolute;
        top: 50%;
        right: 18px;
        transform: translateY(-50%);

        font-size: 14px;
        font-weight: 700;

        width: auto;

        color: ${theme.colors.white};
      }
    `};

  & > svg {
    position: absolute;
    top: 50%;

    transform: translateY(-50%);
    color: rgba(${theme.rgbColors.white}, 0.4);
  }

  &:has(svg + input) {
    & > svg {
      left: 12px;
    }
    input[type="text"] {
      padding-left: 48px;
    }
  }

  &:has(input + svg) {
    & > svg {
      right: 12px;
    }
    input[type="text"] {
      padding-right: 48px;
    }
  }
`

export const SInput = styled.input<{ error?: string; unit?: string }>`
  width: 100%;

  box-sizing: border-box;

  border-radius: 4px;
  border: none;
  border-bottom: 1px solid
    ${({ error }) => (error ? theme.colors.error : theme.colors.darkBlue400)};

  background: rgba(218, 255, 238, 0.06);
  color: ${theme.colors.white};

  font-size: 14px;

  padding: 20px 18px;

  transition: ${theme.transitions.slow};

  ::placeholder {
    color: rgba(114, 131, 165, 0.6);
  }

  :focus,
  :focus-visible,
  :hover {
    outline: none;

    border-bottom: 1px solid
      ${({ error }) =>
        error ? theme.colors.error : theme.colors.brightBlue300};
  }

  ${(p) =>
    p.unit &&
    css`
      padding-right: 50px;
    `}
`

export const SInputBoxContainer = styled.label<{
  error?: boolean
  disabled?: boolean
}>`
  padding: 12px;

  transition: ${theme.transitions.default};

  background: rgba(${theme.rgbColors.alpha0}, 0.06);
  border-radius: 2px;
  border-bottom: 1px solid
    ${(p) => (p.error ? theme.colors.error : theme.colors.darkBlue400)};

  margin-left: calc(var(--modal-content-padding) * -1);
  margin-right: calc(var(--modal-content-padding) * -1);

  @media ${theme.viewport.gte.sm} {
    padding: 12px 12px 8px;
    margin-left: 0;
    margin-right: 0;
  }

  ${({ disabled, error }) =>
    !disabled &&
    css`
      :focus,
      :focus-visible,
      :focus-within,
      :hover {
        outline: none;

        cursor: text;

        background: rgba(${theme.rgbColors.primaryA15}, 0.12);

        border-bottom: 1px solid
          ${error ? theme.colors.error : theme.colors.brightBlue600};
      }
    `}
`

export const SInputBox = styled.input<{ error?: string }>`
  all: unset;

  color: ${theme.colors.white};
  font-size: 14px;

  width: 100%;

  transition: ${theme.transitions.default};

  ::placeholder {
    color: rgba(114, 131, 165, 0.6);
  }

  :focus-visible {
    outline: none;
  }

  &:disabled {
    pointer-events: none;
  }
`

export const SError = styled.p`
  color: ${theme.colors.error};

  font-size: 12px;
  line-height: 14px;
`
