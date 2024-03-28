import { css } from "@emotion/react"
import styled from "@emotion/styled"

export const assetPlaceholderCss = css`
  --uigc-bsx-icon-display: none;
  --uigc-hdx-icon-display: flex;
`

export const SLogoContainer = styled.div`
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
`

export const SWarningIconContainer = styled.div`
  position: absolute;
  display: flex;
  bottom: -3px;
  right: -3px;
  z-index: 1;

  & > svg {
    width: 14px;
    height: 14px;

    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
    stroke: rgba(0, 0, 0, 0.5);
  }
`
