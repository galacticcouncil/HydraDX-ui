import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Content } from "@radix-ui/react-tooltip"
import { ButtonTransparent } from "components/Button/Button"
import { fadeInKeyframes } from "components/Dropdown/Dropdown.styled"
import { theme } from "theme"

export const SList = styled.nav`
  display: none;

  @media ${theme.viewport.gte.sm} {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    height: 34px;

    gap: 12px;

    overflow: hidden;
  }
`
export const SItem = styled.span<{ isActive?: boolean }>`
  display: flex;
  align-items: center;

  padding: 8px 12px;

  height: 34px;

  font-size: 14px;
  font-weight: 500;
  line-height: 18px;

  color: ${theme.colors.iconGray};
  white-space: nowrap;
  text-transform: uppercase;

  position: relative;

  border-radius: 4px;
  transition: ${theme.transitions.slow};

  &:hover {
    color: ${theme.colors.white};
    background: rgba(${theme.rgbColors.alpha0}, 0.06);
    cursor: pointer;
  }

  ${({ isActive }) =>
    isActive &&
    css`
      color: ${theme.colors.brightBlue100};
      background: rgba(${theme.rgbColors.white}, 0.12);
    `};
`

export const SSubMenuContainer = styled(Content)`
  width: calc(100vw - 32px);
  max-width: 352px;

  z-index: ${theme.zIndices.modal};
  overflow: hidden;

  padding: 1px;
  background: linear-gradient(to bottom, #98b0d638, #a3b1c726, transparent);

  box-shadow: 0px 28px 82px rgba(0, 0, 0, 0.44);
  border-radius: 8px;
  backdrop-filter: blur(40px);

  animation: ${fadeInKeyframes} 0.15s ease-in-out;
  transform-origin: top;
`

export const SSubMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 12px;

  background: rgba(0, 3, 22, 0.8);
  border-radius: 7px;
`

export const SArrow = styled.div`
  flex: 1;
  transition: all 0.15s ease-in-out;

  color: rgba(${theme.rgbColors.brightBlue100}, 0.2);
  text-align: end;
`

export const SSubMenuItem = styled(ButtonTransparent)`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;

  width: 100%;
  padding: 16px;

  border-radius: 4px;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: rgba(${theme.rgbColors.alpha0}, 0.06);

    ${SArrow} {
      color: ${theme.colors.brightBlue600};
    }
  }
`
