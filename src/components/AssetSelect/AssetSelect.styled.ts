import { Button } from "components/Button/Button"
import styled from "@emotion/styled"
import { theme } from "theme"
import { css } from "@emotion/react"

export const SContainer = styled.label<{ error?: boolean; disabled?: boolean }>`
  padding: 12px 18px 20px 18px;

  transition: ${theme.transitions.default};

  background: rgba(${theme.rgbColors.alpha0}, 0.06);
  border-radius: 2px;
  border-bottom: 1px solid
    ${(p) => (p.error ? theme.colors.error : theme.colors.darkBlue400)};

  margin-left: calc(var(--modal-content-padding) * -1);
  margin-right: calc(var(--modal-content-padding) * -1);

  @media ${theme.viewport.gte.sm} {
    padding: 12px;
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

export const SMaxButton = styled(Button)`
  background: rgba(${theme.rgbColors.white}, 0.06);
  color: ${theme.colors.white};

  font-weight: 700;
  font-size: 11px;

  border-color: transparent;
  box-sizing: border-box;

  padding: 0 7px;

  :hover {
    background: rgba(${theme.rgbColors.white}, 0.15);
  }
`

export const SSelectAssetButton = styled(Button)`
  display: flex;
  align-items: center;
  background: transparent;

  text-transform: none;

  border: unset;

  padding: 0;
  margin-right: 20px;
  padding: 6px 2px;
  color: white;

  :hover {
    border: unset;
    margin-right: 20px;
    cursor: pointer;
    background: rgba(${theme.rgbColors.white}, 0.06);
  }
`
