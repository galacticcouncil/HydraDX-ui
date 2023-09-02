import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { theme } from "theme"

const fadeInKeyframes = keyframes`
  0% {
    opacity: 0;
    height: 0;
  }

  100% {
    opacity: 1;
    height: 200px;
  }
`

export const STrigger = styled(DropdownMenu.Trigger)`
  all: unset;

  cursor: pointer;

  padding: 12px 18px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  border-radius: 2px;
  border: 1px solid ${theme.colors.darkBlue400};

  background: rgba(${theme.rgbColors.whiteish500}, 0.06);
`

export const SContent = styled(DropdownMenu.Content)`
  background: #191c29;

  border-radius: 2px;

  border: 1px solid ${theme.colors.darkBlue400};

  animation: 150ms cubic-bezier(0.16, 1, 0.3, 1) ${fadeInKeyframes};

  height: 200px;
  overflow: scroll;

  z-index: ${theme.zIndices.toast};
`

export const Item = styled(DropdownMenu.Item)<{ selected: boolean }>`
  color: ${theme.colors.white};
  font-size: 14px;

  padding: 12px 20px;
  margin-right: 5px;

  font-weight: 400;

  display: flex;
  align-items: center;
  gap: 10px;

  background: ${({ selected }) =>
    selected && `rgba(${theme.rgbColors.primaryA15Blue}, 0.35)`};

  transition: all ${theme.transitions.default};

  cursor: pointer;

  &:not(:last-of-type) {
    border-bottom: 1px solid rgba(${theme.rgbColors.white}, 0.06);
  }

  &:focus-visible,
  &:hover {
    outline: none;
    background: rgba(${theme.rgbColors.white}, 0.03);
  }
`
