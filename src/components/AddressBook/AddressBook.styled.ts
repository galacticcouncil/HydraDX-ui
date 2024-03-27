import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div`
  min-height: 400px;
`

export const SItems = styled.div`
  margin: 0 calc(-1 * var(--modal-content-padding))
    calc(-1 * var(--modal-content-padding));
`

export const SHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-column-gap: 8px;
  align-items: center;

  padding: 6px 20px;

  background-color: rgba(${theme.rgbColors.primaryA0}, 0.06);
`
