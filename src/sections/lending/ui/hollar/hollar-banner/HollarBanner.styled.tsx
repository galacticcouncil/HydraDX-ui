import styled from "@emotion/styled"
import { Link } from "@tanstack/react-location"
import { theme } from "theme"

import LinesSvg from "./assets/lines.svg"

export const SContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  position: relative;
`

export const SInnerContainer = styled(Link)`
  display: flex;
  align-items: none;
  flex-direction: column;
  justify-content: space-around;
  gap: 6px;

  overflow: hidden;

  position: relative;

  border: 1px solid rgba(124, 175, 255, 0.4);
  border-radius: ${theme.borderRadius.medium}px;

  background: linear-gradient(
    90deg,
    rgba(0, 87, 159, 0.66) 25%,
    rgba(110, 42, 255, 0) 100%
  );

  @media ${theme.viewport.gte.sm} {
    height: 89px;
  }

  &:before {
    content: "";
    position: absolute;
    inset: -1px;
    opacity: 0.6;
    overflow: hidden;
    border-radius: ${theme.borderRadius.medium}px;
    background: radial-gradient(
      75% 200% at 6.95% 26.97%,
      rgba(172, 66, 255, 0.85) 0%,
      rgba(58, 113, 255, 0) 100%
    );
  }

  &:after {
    content: "";
    position: absolute;
    inset: -1px;
    background: center left url(${LinesSvg}) no-repeat;
    background-size: 120% 100%;
    transform: rotate(-15deg) scale(1.5) translateX(-20%);
    opacity: 0.5;

    @media ${theme.viewport.gte.sm} {
      background-size: auto;
      transform: none;
      opacity: 1;
    }
  }
`

export const SContent = styled.div`
  position: relative;
  height: 100%;

  padding: 20px;

  display: flex;
  flex-direction: column;

  @media ${theme.viewport.gte.sm} {
    padding-left: 140px;
    padding-right: 34px;

    flex-direction: row;
    align-items: center;
  }
`

export const SValuesContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;

  margin-top: 20px;

  @media ${theme.viewport.gte.sm} {
    gap: 60px;

    margin-left: auto;
    margin-top: 0;
  }
`

export const SHollarImage = styled.img`
  position: absolute;

  top: -15px;
  right: 0;

  @media ${theme.viewport.gte.sm} {
    bottom: -15px;
    left: 8px;

    top: auto;
    right: auto;
  }
`
