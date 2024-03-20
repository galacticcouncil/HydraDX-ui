import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;

  font-size: 12px;

  border: 1px solid ${theme.colors.basic800};
  border-radius: ${theme.borderRadius.default}px;

  cursor: pointer;

  background-color: transparent;
  &:hover {
    background-color: rgba(${theme.rgbColors.basic300}, 0.2);
    border-color: rgba(${theme.rgbColors.basic300}, 0.2);
  }
`
