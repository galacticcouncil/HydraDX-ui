import isPropValid from "@emotion/is-prop-valid"
import { css, Theme } from "@emotion/react"
import styled from "@emotion/styled"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { createVariants, pxToRem } from "@/utils"

export type ToggleGroupSize = "small" | "medium" | "large"

export type ToggleGroupProps = {
  size?: ToggleGroupSize
  fullWidth?: boolean
}

const sizes = createVariants<ToggleGroupSize>((theme) => ({
  small: css`
    --tg-py: ${theme.space.s};
    --tg-px: ${theme.space.m};
    padding: var(--tg-py) var(--tg-px);
    font-size: ${theme.fontSizes.p6};
    svg {
      width: ${theme.space.m};
      height: ${theme.space.m};
    }
  `,
  medium: css`
    --tg-py: ${theme.space.base};
    --tg-px: ${theme.buttons.paddings.primary};
    line-height: 1.2;
    height: ${pxToRem(30)};
    font-size: ${theme.fontSizes.p6};
    padding: var(--tg-py) var(--tg-px);
    svg {
      width: ${theme.space.l};
      height: ${theme.space.l};
    }
  `,
  large: css`
    --tg-py: ${theme.space.m};
    --tg-px: ${theme.space.xxl};
    padding: var(--tg-py) var(--tg-px);
    font-size: ${theme.fontSizes.p4};
    svg {
      width: ${theme.space.l};
      height: ${theme.space.l};
    }
  `,
}))

const disabledStyles = (theme: Theme) => css`
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &[data-state="on"] {
      background-color: ${theme.buttons.secondary.low.hover};
    }

    &:hover {
      background-color: transparent;
    }

    &[data-state="on"]:hover {
      background-color: ${theme.buttons.secondary.low.hover};
    }
  }
`

export const SToggleGroupIcon = styled("span")(
  () => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
)

export const SToggleGroupItem = styled(ToggleGroupPrimitive.Item, {
  shouldForwardProp: (prop) =>
    isPropValid(prop) && prop !== "size" && prop !== "$iconOnly",
})<{
  size?: ToggleGroupSize
  $iconOnly?: boolean
}>(({ theme, size = "medium", $iconOnly = false }) => [
  css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.space.base};

    cursor: pointer;

    font-weight: 500;
    white-space: nowrap;

    border: 0;
    border-radius: ${theme.radii.full};

    transition: ${theme.transitions.colors};

    background-color: transparent;
    color: ${theme.icons.onSurface};

    &:hover:not(:disabled) {
      background-color: ${theme.buttons.secondary.low.hover};
    }

    &[data-state="on"]:not(:disabled) {
      background-color: ${theme.buttons.primary.medium.rest};
      color: ${theme.buttons.primary.medium.onButton};
    }
  `,
  sizes(size),
  disabledStyles(theme),
  $iconOnly &&
    css`
      padding-inline: var(--tg-py);
    `,
])

export const SToggleGroup = styled(ToggleGroupPrimitive.Root, {
  shouldForwardProp: (prop) =>
    isPropValid(prop) && prop !== "size" && prop !== "fullWidth",
})<ToggleGroupProps & { hasMarker?: boolean }>(
  ({ theme, size = "medium", fullWidth = false, hasMarker = false }) => [
    css`
      position: relative;
      display: flex;
      align-items: center;
      gap: ${size === "small"
        ? theme.space.xs
        : size === "medium"
          ? theme.inputs.paddings.internal
          : theme.space.s};
      padding: ${size === "small"
        ? theme.space.xs
        : size === "medium"
          ? `${theme.inputs.paddings.internal} ${theme.space.s}`
          : theme.space.s};

      border-radius: ${theme.radii.full};
      border: 1px solid ${theme.buttons.secondary.low.borderRest};

      ${fullWidth
        ? css`
            width: 100%;

            ${SToggleGroupItem} {
              flex: 1;
            }
          `
        : css`
            width: fit-content;
          `}
    `,
    hasMarker &&
      css`
        &::before {
          content: "";
          position: absolute;
          left: var(--marker-left, 0);
          top: var(--marker-top, 0);
          width: var(--marker-width, 0);
          height: var(--marker-height, 0);

          border-radius: ${theme.radii.full};
          background-color: ${theme.buttons.primary.medium.rest};

          opacity: 0;
          pointer-events: none;
          transition: ${theme.transitions.opacity};
        }

        &[data-marker="on"]::before {
          opacity: 1;
        }

        &[data-marker="on"]:has(${SToggleGroupItem}[data-state="on"]:disabled)::before {
          background-color: ${theme.buttons.secondary.low.hover};
        }

        &[data-marker="on"][data-marker-live]::before {
          transition:
            left 0.3s ${theme.easings.outQuart},
            width 0.3s ${theme.easings.outQuart},
            ${theme.transitions.opacity};
        }

        ${SToggleGroupItem} {
          position: relative;
          z-index: 1;

          &[data-state="on"] {
            background-color: transparent;

            &:hover:not(:disabled) {
              background-color: transparent;
            }

            &:disabled:hover {
              background-color: transparent;
            }
          }
        }
      `,
  ],
)
