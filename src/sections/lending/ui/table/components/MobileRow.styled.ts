import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div`
  color: ${theme.colors.white};

  margin-left: 12px;
  margin-right: 12px;
  margin-bottom: 10px;
  &:last-of-type {
    margin-bottom: 20px;
  }

  border-radius: ${theme.borderRadius.default}px;

  padding: 20px;
  border: 1px solid rgba(${theme.rgbColors.primaryA0}, 0.35);
  background: rgba(${theme.rgbColors.alpha0}, 0.06);
`

export const SValuesContainer = styled.div`
  & > div {
    border-top: 1px solid rgba(${theme.rgbColors.white}, 0.06);
    margin-top: 16px;
    padding-top: 16px;
  }
`
