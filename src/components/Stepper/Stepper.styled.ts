import styled from "@emotion/styled"
import { theme } from "theme"

export const SStepperContainer = styled.div<{ width?: number | string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  width: 100%;
  margin: 0 auto;

  & > div {
    position: relative;
  }

  & > div:first-of-type > p {
    left: ${({ width }) => (width === "100%" ? "0" : "auto")};
  }

  & > div:last-of-type > p {
    right: ${({ width }) => (width === "100%" ? "0" : "auto")};
  }
`

export const SCircle = styled.div`
  width: 14px;
  height: 14px;

  border-radius: 9999px;
  border: 1px solid ${theme.colors.basic500};

  transition: all ${theme.transitions.default};
  flex-shrink: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  @media ${theme.viewport.gte.sm} {
    width: 26px;
    height: 26px;
  }
`

export const SThumbContainer = styled.div<{ isDone?: boolean }>`
  width: 10px;
  height: 10px;

  border-radius: 9999px;

  background: ${({ isDone }) =>
    isDone
      ? `rgba(${theme.rgbColors.primaryA15}, 0.12);`
      : theme.colors.brightBlue700};

  display: flex;
  justify-content: center;
  align-items: center;

  @media ${theme.viewport.gte.sm} {
    width: 18px;
    height: 18px;
  }
`

export const SStepperLine = styled.div`
  height: 1px;

  flex-grow: 1;

  background: ${theme.colors.basic500};

  margin: 0 3px;
`
