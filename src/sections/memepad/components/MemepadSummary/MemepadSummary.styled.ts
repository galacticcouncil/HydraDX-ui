import styled from "@emotion/styled"
import { theme } from "theme"
import DecorativeStarIcon from "assets/icons/DecorativeStarIcon.svg?react"

export const SContainer = styled.div`
  position: relative;

  width: 100%;

  margin: 0 auto;

  max-width: 600px;

  @media ${theme.viewport.gte.md} {
    display: grid;
    grid-template-columns: 1fr 600px 1fr;
    gap: 40px;

    max-width: 100%;
  }
`

export const SHeading = styled.div`
  position: relative;

  margin-bottom: 30px;
  padding-bottom: 20px;

  border-bottom: 1px solid rgba(${theme.rgbColors.darkBlue100}, 0.2);

  svg {
    position: absolute;
    display: none;

    @media ${theme.viewport.gte.sm} {
      display: block;
    }
  }

  svg:nth-of-type(1) {
    bottom: 20px;
    left: 0;
  }

  svg:nth-of-type(2) {
    top: 0;
    right: 0;

    animation-delay: -0.5s;
  }
`
export const SRowItem = styled.div`
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;

  padding: 7px 0;
  min-height: 35px;

  border-bottom: 1px solid rgba(${theme.rgbColors.darkBlue400}, 0.3);

  &:last-of-type {
    border-bottom: none;
  }
`

export const SDecorativeStarIcon = styled(DecorativeStarIcon)`
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }
`
