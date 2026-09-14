import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { Input } from "@/components/Input"
import { pxToRem } from "@/utils"

const MAIN_ROW_HEIGHT = pxToRem(32)
const AMOUNT_ROW_HEIGHT = pxToRem(24)
const SUBLINE_ROW_HEIGHT = pxToRem(14)

const truncate = css`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export const SRoot = styled.div<{ isAmountHidden: boolean }>(
  ({ theme, isAmountHidden }) => css`
    display: grid;
    column-gap: ${theme.space.m};
    min-width: 0;

    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto ${AMOUNT_ROW_HEIGHT} ${SUBLINE_ROW_HEIGHT};
    grid-template-areas: ${isAmountHidden
      ? `"header header" ". ." ". sub"`
      : `"header header" "asset amount" "asset sub"`};
  `,
)

export const SHeader = styled.div(
  ({ theme }) => css`
    grid-area: header;

    display: flex;
    align-items: center;
    gap: ${theme.space.s};
    min-width: 0;
    min-height: ${pxToRem(20)};
    margin-bottom: ${theme.space.m};
  `,
)

export const SLabel = styled.div(
  ({ theme }) => css`
    ${truncate};
    flex: 1 1 0;

    font-size: ${theme.fontSizes.p5};
    line-height: 1.2;
    color: ${theme.text.medium};
  `,
)

export const SBalance = styled.div(
  ({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.space.s};
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
  `,
)

export const SBalanceText = styled.div(
  ({ theme }) => css`
    ${truncate};

    font-size: ${theme.fontSizes.p5};
    font-weight: 500;
    line-height: 1.2;
    color: ${theme.text.low};
  `,
)

export const SAssetGroup = styled.div<{ isFullWidth: boolean }>(
  ({ theme, isFullWidth }) => css`
    align-self: center;
    justify-self: start;
    ${isFullWidth
      ? css`
          grid-row: 2 / 4;
          grid-column: 1 / -1;
          justify-self: stretch;
          width: 100%;
        `
      : css`
          grid-area: asset;
        `}

    display: flex;
    align-items: center;
    gap: ${theme.space.s};
    min-width: 0;
  `,
)

export const SAssetButton = styled.button<{
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  fullWidth: boolean
}>(
  ({ theme, isError, isEmpty, isLoading, fullWidth }) => css`
    display: inline-flex;
    align-items: center;
    gap: ${theme.space.s};
    flex-shrink: ${fullWidth ? 1 : 0};
    flex-grow: ${fullWidth ? 1 : 0};
    min-width: ${fullWidth ? 0 : "auto"};
    ${fullWidth ? truncate : ""};
    box-sizing: border-box;
    height: ${MAIN_ROW_HEIGHT};
    margin: 0;
    padding-block: 0;
    padding-inline: ${isEmpty ? theme.space.l : theme.space.s} ${theme.space.m};

    font: inherit;
    font-size: ${theme.fontSizes.p3};
    font-weight: 600;
    white-space: nowrap;
    color: ${isEmpty ? theme.buttons.primary.medium.onButton : theme.text.high};

    background: ${isEmpty ? theme.buttons.primary.medium.rest : "none"};
    border-radius: ${theme.radii.full};
    border: 1px solid
      ${isError
        ? theme.accents.danger.dimBg
        : isEmpty || isLoading
          ? "transparent"
          : theme.buttons.secondary.low.borderRest};

    transition: ${theme.transitions.colors};

    &:enabled {
      cursor: pointer;
    }

    &:enabled:hover {
      border-color: ${isEmpty
        ? "transparent"
        : theme.buttons.secondary.low.hover};
      background: ${isEmpty
        ? theme.buttons.primary.medium.hover
        : theme.buttons.secondary.low.primaryHover};
    }

    &:disabled {
      cursor: default;
    }

    & > svg {
      margin-right: -${theme.space.base};
      color: ${isEmpty ? "currentColor" : theme.icons.onContainer};
    }
  `,
)

export const SLockButton = styled.button<{ isLocked: boolean }>(
  ({ theme, isLocked }) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    width: ${MAIN_ROW_HEIGHT};
    height: ${MAIN_ROW_HEIGHT};
    margin: 0;
    padding: 0;

    font: inherit;
    color: ${isLocked
      ? theme.buttons.secondary.accent.onRest
      : theme.text.medium};
    background: ${isLocked
      ? theme.buttons.secondary.accent.rest
      : theme.buttons.secondary.low.rest};
    border-radius: ${theme.radii.full};
    border: 1px solid
      ${isLocked
        ? theme.buttons.secondary.accent.onRest
        : theme.buttons.secondary.low.borderRest};

    transition: ${theme.transitions.colors};
    cursor: pointer;

    &:hover {
      background: ${isLocked
        ? theme.buttons.secondary.accent.hover
        : theme.buttons.secondary.low.hover};
    }

    & > svg {
      color: ${isLocked ? "currentColor" : theme.icons.onContainer};
    }
  `,
)

export const SAmount = styled.div(
  ({ theme }) => css`
    grid-area: amount;
    position: relative;
    display: flex;
    min-width: 0;

    & input {
      text-align: right;
      font-size: ${theme.fontSizes.p2};
      font-variant-numeric: tabular-nums;
    }

    & input[aria-busy="true"] {
      opacity: 0;
    }
  `,
)

export const SAmountInput = styled(Input)`
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0;
`

export const SOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
`

export const SSubline = styled.div<{ isError: boolean }>(
  ({ theme, isError }) => css`
    ${truncate};
    grid-area: sub;
    align-self: center;
    position: relative;
    z-index: 1;
    min-height: ${SUBLINE_ROW_HEIGHT};

    font-size: ${theme.fontSizes.p6};
    line-height: 1;
    text-align: right;
    color: ${isError ? theme.accents.danger.secondary : theme.text.low};
  `,
)
