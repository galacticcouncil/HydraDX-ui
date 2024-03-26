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
    const cols = isNativeAsset ? 3 : hasChain ? 2 : 1
    return `
      grid-template-columns: repeat(${cols}, 1fr);

      & > div {
        text-align: center;

        &:not(:nth-of-type(${cols})):not(:nth-of-type(${cols * 2 + 1})) {
          border-right: 1px solid rgba(158, 167, 186, 0.06);
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

export const SLocksContainer = styled.div`
  margin-top: 2px;
  padding: 0 4px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  border-radius: 4px;

  background: rgba(${theme.rgbColors.white}, 0.06);
`
