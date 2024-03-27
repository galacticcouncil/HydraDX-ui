import styled from "@emotion/styled"
import { ButtonTransparent } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"

export const SItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-column-gap: 8px;
  align-items: center;

  padding: 16px 20px;

  &:hover {
    cursor: pointer;
    background: rgba(${theme.rgbColors.white}, 0.06);
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.darkBlue401};
  }
`

export const SNameContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 8px;
  align-items: center;
`

export const SName = styled(Text)`
  font-weight: 700;
  font-family: "ChakraPetchBold";
  font-size: 14px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const SAddressContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-column-gap: 6px;
  align-items: center;
`

export const SAddress = styled(Text)`
  color: ${theme.colors.basic300};
  font-weight: 400;
  font-size: 12px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const SButton = styled(ButtonTransparent)`
  padding: 6px;
  color: ${theme.colors.basic700};
  transition: all 0.15s ease-in-out;

  &:hover {
    color: ${theme.colors.basic500};
  }
`
