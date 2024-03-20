import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.label<{
  disabled?: boolean
  error?: boolean
}>`
  display: block;

  position: relative;
  padding: 18px;

  background: rgba(${theme.rgbColors.alpha0}, 0.06);
  transition: ${theme.transitions.default};

  border-radius: 2px;
  border-bottom: 1px solid
    ${(p) => (p.error ? theme.colors.error : theme.colors.darkBlue400)};

  :focus,
  :focus-visible,
  :focus-within,
  :hover {
    cursor: text;

    ${({ disabled, error }) => {
      if (!disabled)
        return css`
          outline: none;

          background: rgba(${theme.rgbColors.primaryA15}, 0.12);

          border-bottom: 1px solid
            ${error ? theme.colors.error : theme.colors.brightBlue600};
        `
    }}
  }

  input[type="text"] {
    unset: all;

    color: white;
    background: none;
    border: none;

    padding: 0;
    margin: 0;

    text-align: right;

    font-size: 14px;
    font-family: "ChakraPetchSemibold";

    :focus,
    :focus-visible,
    :focus-within,
    :hover {
      outline: none;
    }
  }
`
