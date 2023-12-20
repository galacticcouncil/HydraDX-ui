import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Button } from "components/Button/Button"
import { theme } from "theme"

export const SContainer = styled.div<{
  disabled: boolean
}>`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 16px;

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.3;
      pointer-events: none;
      user-select: none;
    `}

  @media ${theme.viewport.gte.sm} {
    display: grid;
    gap: 12px 16px;
    grid-template-columns: 2fr 1fr;
  }

  @media ${theme.viewport.gte.md} {
    max-width: 90%;
  }
`

export const SPreviewBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  position: relative;

  padding: 14px 100px 14px 16px;

  border-radius: ${theme.borderRadius.default}px;
  border: 1px dashed rgba(${theme.rgbColors.brightBlue100}, 0.35);

  @media ${theme.viewport.gte.sm} {
    min-width: 220px;
  }
`

export const SCopyButton = styled(Button)`
  position: absolute;

  border-color: transparent !important;

  right: 16px;
  top: 50%;

  transform: translateY(-50%) !important;
`

export const SPathButton = styled(Button)`
  color: ${({ active }) =>
    active ? theme.colors.basic900 : theme.colors.white};

  padding: 2px 6px;

  background-color: ${({ active }) =>
    active
      ? theme.colors.brightBlue300
      : `rgba(${theme.rgbColors.primaryA15}, 0.12)`};

  border: 0 !important;
`

export const SPreviewPathSelect = styled.div`
  padding-left: 16px;

  grid-column: span 2;

  display: flex;
  gap: 5px;

  flex-direction: row;
  flex-wrap: wrap;
`