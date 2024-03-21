import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div<{
  hasChain: boolean
  isNativeAsset: boolean
}>`
  display: grid;
  gap: 12px;

  @media ${theme.viewport.gte.sm} {
    gap: 30px;
  }

  ${({ hasChain, isNativeAsset }) => {
    const cols = isNativeAsset ? 2 : hasChain ? 2 : 1
    return `
      grid-template-columns: repeat(${cols}, 1fr);
      justify-items: ${cols === 1 ? "center" : "normal"};

      & > div {
        text-align: center;

        &:not(:nth-of-type(${cols}n)) {
          border-right: 1px solid rgba(255, 255, 255, 0.12);
        }

        &:not(:has(p)) {    
          display: ${hasChain ? "block" : "none"};
          border-right: none !important;
        }

        @media ${theme.viewport.gte.sm} {
          padding: 0 35px;
        }
      }
    `
  }}
`
