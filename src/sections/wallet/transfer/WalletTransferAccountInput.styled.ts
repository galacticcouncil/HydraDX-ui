import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { ButtonTransparent } from "components/Button/Button"
import { theme } from "theme"

export const SContainer = styled.label<{ error?: boolean; disabled?: boolean }>`
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
`

export const SAddressBookButton = styled(ButtonTransparent)`
  position: absolute;
  top: 16px;
  right: 16px;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 2px 8px;

  color: ${theme.colors.darkBlue100};
  background: rgba(84, 99, 128, 0.35);
  text-transform: uppercase;

  &:hover {
    background: rgba(84, 99, 128, 0.5);
  }
`

export const SIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 9999px;

  background: ${theme.colors.darkBlue400};
`
