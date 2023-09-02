import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div<{ type: "staking" | "toast" }>`
  padding: 16px;
  ${({ type }) =>
    type === "toast"
      ? css`
          border-radius: ${theme.borderRadius.default}px;
        `
      : css`
          border-radius: ${theme.borderRadius.stakingCard}px;

          position: relative;

          :before {
            content: "";
            position: absolute;
            inset: 0;

            border-radius: ${theme.borderRadius.stakingCard}px;
            padding: 1px; // a width of the border

            background: linear-gradient(
              180deg,
              rgba(152, 176, 214, 0.27) 0%,
              rgba(163, 177, 199, 0.15) 66.67%,
              rgba(158, 167, 180, 0.2) 100%
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }
        `}

  background: ${theme.colors.darkBlue700};

  transition: background ${theme.transitions.default};

  cursor: pointer;

  &:hover {
    background: ${theme.colors.darkBlue401};
  }

  &:active {
    background: ${theme.colors.darkBlue400};
  }
`

export const SHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const SBar = styled.div<{
  variant: "aye" | "nay" | "neutral"
  percentage: number
  height?: number
}>`
  height: ${({ height }) => (height ? `${height}px` : "4px")};
  width: ${({ percentage }) => percentage}%;

  border-radius: 4px;
  ${({ variant }) =>
    variant === "aye"
      ? css`
          background: linear-gradient(
            270deg,
            ${theme.colors.green600} 50%,
            transparent 100%
          );
        `
      : variant === "nay"
      ? css`
          background: linear-gradient(
            90deg,
            ${theme.colors.pink700} 50%,
            transparent 100%
          );
        `
      : css`
          background: rgba(${theme.rgbColors.darkBlue300}, 0.5);
        `}
`

export const SVotedBage = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  color: ${theme.colors.basic900};
  background: ${theme.colors.brightBlue600};

  text-transform: uppercase;
  font-size: 13px;
  line-height: normal;
  font-family: ChakraPetchSemiBold;

  border-radius: 2px;

  padding: 4px 8px;
`
