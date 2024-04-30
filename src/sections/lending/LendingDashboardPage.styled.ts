import styled from "@emotion/styled"
import { theme } from "theme"
export const SContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media ${theme.viewport.gte.xl} {
    grid-template-columns: 1fr 1fr;
  }
`

export const SFilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`
