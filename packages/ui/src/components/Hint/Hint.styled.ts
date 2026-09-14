import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Arrow, Content } from "@radix-ui/react-popover"

import { ButtonTransparent } from "@/components"
import { pxToRem } from "@/utils"

export const SContent = styled(Content)(
  ({ theme }) => css`
    z-index: ${theme.zIndices.modal - 1};

    max-width: ${theme.sizes["4xl"]};
    min-width: calc(${theme.sizes["4xl"]} - 3rem);

    padding: ${theme.space.m} ${theme.space.l};
    border-radius: ${theme.radii.m};

    font-size: ${theme.fontSizes.p5};
    line-height: ${theme.lineHeights.m};

    background: ${theme.colors.azureBlue[300]};
    color: ${theme.colors.darkBlue[900]};

    box-shadow: 2px 2px 5px 0px rgba(41, 41, 60, 0.15);

    &:has(> span[style*="visibility: hidden"] > [data-hint-arrow]) {
      & > [data-hint-centered-arrow] {
        display: block;
      }
    }

    animation-duration: 150ms;
    animation-timing-function: ${theme.easings.outExpo};

    &[data-state$="open"] {
      &[data-side="top"] {
        animation-name: ${theme.animations.scaleInTop};
      }

      &[data-side="bottom"] {
        animation-name: ${theme.animations.scaleInBottom};
      }

      &[data-side="left"] {
        animation-name: ${theme.animations.scaleInLeft};
      }

      &[data-side="right"] {
        animation-name: ${theme.animations.scaleInRight};
      }
    }

    &[data-state="closed"] {
      &[data-side="top"] {
        animation-name: ${theme.animations.scaleOutTop};
      }

      &[data-side="bottom"] {
        animation-name: ${theme.animations.scaleOutBottom};
      }

      &[data-side="left"] {
        animation-name: ${theme.animations.scaleOutLeft};
      }

      &[data-side="right"] {
        animation-name: ${theme.animations.scaleOutRight};
      }
    }
  `,
)

export const SArrow = styled(Arrow)(
  ({ theme }) => css`
    fill: ${theme.colors.azureBlue[300]};
  `,
)

export const SCenteredArrow = styled("svg")(
  ({ theme }) => css`
    position: absolute;
    display: none;

    fill: ${theme.colors.azureBlue[300]};

    [data-side="top"] > & {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
    }

    [data-side="right"] > & {
      top: 50%;
      right: calc(100% - ${pxToRem(4)});
      transform: translateY(-50%) rotate(90deg);
    }

    [data-side="bottom"] > & {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(180deg);
    }

    [data-side="left"] > & {
      top: 50%;
      left: calc(100% - ${pxToRem(4)});
      transform: translateY(-50%) rotate(-90deg);
    }
  `,
)

export const SIconButton = styled("button")(
  ({ theme }) => css`
    all: unset;

    flex-shrink: 0;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: ${pxToRem(20)};
    height: ${pxToRem(20)};
    border-radius: ${theme.radii.full};

    color: ${theme.colors.darkBlue[900]};
    cursor: pointer;

    &:hover {
      background: rgba(13, 21, 37, 0.1);
    }

    &:focus-visible {
      outline: 1px solid ${theme.colors.darkBlue[900]};
    }
  `,
)

export const SAdvanceButton = styled(ButtonTransparent)(
  ({ theme }) => css`
    background: ${theme.colors.darkBlue[900]};
    color: ${theme.colors.azureBlue[200]};
    border-radius: ${theme.radii.base};

    font-size: ${theme.fontSizes.p6};
    font-weight: 600;

    line-height: 1;

    padding-inline: ${theme.space.base};
    padding-block: ${theme.space.s};

    transition: ${theme.transitions.colors};

    &:hover {
      background: ${theme.colors.azureBlue[700]};
      color: ${theme.colors.azureBlue[100]};
    }
  `,
)
