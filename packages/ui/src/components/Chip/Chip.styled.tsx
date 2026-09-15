import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { Box } from "@/components"
import { createVariants } from "@/utils"

export type ChipVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "red"
  | "orange"
  | "amber"
  | "lime"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"

export type ChipSize = "extra-small" | "small" | "medium" | "large"
export type SChipProps = {
  variant?: ChipVariant
  size?: ChipSize
  rounded?: boolean
}

const variantStyles = (color: string, bg: string) => css`
  background-color: ${bg};
  color: ${color};
`

const variants = createVariants(({ buttons, accents, tags: { soft } }) => ({
  primary: variantStyles(
    buttons.primary.high.onButton,
    buttons.primary.high.rest,
  ),
  secondary: variantStyles(
    buttons.primary.medium.onButton,
    buttons.primary.medium.rest,
  ),
  tertiary: variantStyles(
    buttons.primary.low.onButton,
    buttons.primary.low.rest,
  ),
  info: variantStyles(accents.info.onPrimary, accents.info.primary),
  success: variantStyles(accents.success.onEmphasis, accents.success.emphasis),
  warning: variantStyles(accents.alertAlt.onPrimary, accents.alertAlt.primary),
  danger: variantStyles(accents.danger.onPrimary, accents.danger.secondary),
  red: variantStyles(soft.red.foreground, soft.red.background),
  orange: variantStyles(soft.orange.foreground, soft.orange.background),
  amber: variantStyles(soft.amber.foreground, soft.amber.background),
  lime: variantStyles(soft.lime.foreground, soft.lime.background),
  green: variantStyles(soft.green.foreground, soft.green.background),
  cyan: variantStyles(soft.cyan.foreground, soft.cyan.background),
  blue: variantStyles(soft.blue.foreground, soft.blue.background),
  purple: variantStyles(soft.purple.foreground, soft.purple.background),
  pink: variantStyles(soft.pink.foreground, soft.pink.background),
}))

const sizes = createVariants((theme) => ({
  "extra-small": css`
    font-size: ${theme.fontSizes.p6};
    padding-block: ${theme.space.xs};
    padding-inline: ${theme.space.s};
    height: 1rem;
  `,
  small: css`
    font-size: ${theme.fontSizes.p6};
    padding: ${theme.space.base};
    height: 1.125rem;
  `,
  medium: css`
    font-size: ${theme.fontSizes.p6};
    padding: ${theme.space.base};
    height: 1.375rem;
  `,
  large: css`
    font-size: ${theme.fontSizes.p5};
    padding: ${theme.space.base} ${theme.space.m};
    height: 1.625rem;
  `,
}))

export const SChip = styled(Box, {
  shouldForwardProp: (prop) => !["variant", "size", "rounded"].includes(prop),
})<SChipProps>(
  ({ theme, variant = "primary", size = "medium", rounded = false }) => [
    variants(variant),
    sizes(size),
    css`
      display: inline-flex;
      align-items: center;
      gap: ${theme.space.s};
      flex-shrink: 0;
      width: fit-content;
      white-space: nowrap;

      font-weight: 500;
      line-height: 1;

      border-radius: ${rounded ? theme.radii.full : theme.radii.base};
    `,
  ],
)
