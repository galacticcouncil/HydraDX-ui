import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div<{ active?: boolean }>`
  background: ${theme.colors.darkBlue700};

  border: 1px solid rgba(152, 176, 214, 0.27);
  border-radius: ${theme.borderRadius.medium}px;

  padding: 20px;

  display: ${({ active }) => (active ? "block" : "none")} !important;

  @media ${theme.viewport.gte.sm} {
    padding: 30px;
  }

  @media ${theme.viewport.gte.xl} {
    display: block !important;
  }
`

export const SFilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  @media ${theme.viewport.gte.sm} {
    max-width: 400px;
  }

  @media ${theme.viewport.gte.xl} {
    display: none;
  }
`

export const SContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  > div {
    height: fit-content;
  }

  > div:nth-of-type(2) {
    display: none;
  }

  @media ${theme.viewport.gte.xl} {
    flex-direction: row;

    > div:nth-of-type(1) {
      width: calc(100% - 400px);
    }

    > div:nth-of-type(2) {
      display: block;
      width: 400px;
    }
  }
`
