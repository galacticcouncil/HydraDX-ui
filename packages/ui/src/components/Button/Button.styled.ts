import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { Box } from "@/components/Box"
import { createStyles, createVariants } from "@/utils"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "emphasis"
  | "accent"
  | "success"
  | "muted"
  | "transparent"
  | "sliderTabActive"
  | "sliderTabInactive"
  | "restSubtle"

export type MicroButtonVariant = "low" | "emphasis"

export type ButtonSize = "small" | "medium" | "large"

export type SButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  outline?: boolean
  blur?: boolean
  glow?: boolean
}

const defaulStyles = createStyles(
  (theme) => css`
    position: relative;
    display: grid;
    grid-auto-flow: column;
    column-gap: ${theme.space.base};
    align-items: center;
    place-content: center;

    text-decoration: none;
    font-family: ${theme.fontFamilies1.secondary};
    font-weight: 500;
    white-space: nowrap;

    border-radius: ${theme.radii.full};

    cursor: pointer;

    transition: ${theme.transitions.colors}, ${theme.transitions.opacity};

    &:is(:link) {
      text-decoration: none;
    }

    & > svg {
      width: 1em;
      height: 1em;
    }
  `,
)

const microVariantStyles = (
  color: string,
  bg: string,
  borderColor: string,
  bgHover: string,
  colorHover?: string,
) => css`
  background-color: ${bg};
  color: ${color};

  border-color: ${borderColor};

  &:hover:not(:disabled):not([aria-disabled="true"]) {
    background-color: ${bgHover};
    color: ${colorHover};
  }
`

const variantStyles = (
  color: string,
  bg: string,
  bgHover: string,
  colorHover?: string,
) => css`
  background-color: ${bg};
  color: ${color};
  &:hover:not(:disabled):not([aria-disabled="true"]) {
    background-color: ${bgHover};
    color: ${colorHover};
  }
`

const outlineVariantStyles = (
  color: string,
  border: "none" | (string & NonNullable<unknown>),
  bg: string,
  bgHover: string,
) => css`
  background-color: ${bg};
  color: ${color};
  &:hover:not(:disabled):not([aria-disabled="true"]),
  &:focus:not(:disabled):not([aria-disabled="true"]) {
    background-color: ${bgHover};
  }

  ${border === "none"
    ? css`
        box-shadow: none;
      `
    : css`
        box-shadow: inset 0 0 0 1px ${border};
      `}
`

const blowVariantStyles = (border: string, glow: string) => css`
  box-shadow:
    inset 0 0 0 1px ${border},
    0 0 10px 2px ${glow};
`

const disabledStyles = css`
  &:disabled,
  &[aria-disabled="true"] {
    cursor: not-allowed;

    opacity: 0.2;
  }
`

const blurStyles = css`
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`

const variants = createVariants<ButtonVariant>((theme) => ({
  primary: variantStyles(
    theme.buttons.primary.high.onButton,
    theme.buttons.primary.high.rest,
    theme.buttons.primary.high.hover,
  ),
  secondary: variantStyles(
    theme.buttons.primary.medium.onButton,
    theme.buttons.primary.medium.rest,
    theme.buttons.primary.medium.hover,
  ),
  tertiary: variantStyles(
    theme.buttons.primary.low.onButton,
    theme.buttons.primary.low.rest,
    theme.buttons.primary.low.hover,
  ),
  danger: variantStyles(
    theme.buttons.primary.high.onButton,
    theme.buttons.secondary.danger.onRest,
    theme.buttons.secondary.danger.outline,
  ),
  emphasis: variantStyles(
    theme.buttons.primary.high.onButton,
    theme.buttons.secondary.emphasis.onRest,
    theme.buttons.secondary.emphasis.outline,
  ),
  accent: variantStyles(
    theme.buttons.primary.high.onButton,
    theme.buttons.secondary.accent.onRest,
    theme.buttons.secondary.accent.outline,
  ),
  success: variantStyles(
    theme.accents.success.onEmphasis,
    theme.accents.success.emphasis,
    theme.accents.success.dim,
  ),
  muted: variantStyles(
    theme.buttons.secondary.low.onRest,
    theme.buttons.outlineDark.rest,
    theme.colors.darkBlue.alpha[200],
  ),
  transparent: variantStyles(
    theme.text.high,
    "transparent",
    theme.colors.darkBlue.alpha[200],
  ),
  sliderTabActive: variantStyles(
    theme.buttons.primary.medium.onButton,
    theme.buttons.primary.medium.rest,
    theme.buttons.primary.medium.hover,
  ),
  sliderTabInactive: variantStyles(
    theme.buttons.primary.low.onButton,
    theme.buttons.primary.low.rest,
    theme.buttons.primary.low.hover,
  ),
  restSubtle: variantStyles(
    theme.buttons.secondary.low.onRest,
    "transparent",
    theme.buttons.outlineDark.hover,
    theme.buttons.outlineDark.onRest,
  ),
}))

const microVariants = createVariants<MicroButtonVariant>((theme) => ({
  low: microVariantStyles(
    theme.text.medium,
    theme.buttons.secondary.low.rest,
    theme.buttons.secondary.low.borderRest,
    theme.buttons.secondary.low.hover,
    theme.text.high,
  ),
  emphasis: microVariantStyles(
    theme.buttons.secondary.accent.onRest,
    theme.buttons.secondary.accent.rest,
    theme.buttons.secondary.accent.outline,
    theme.buttons.secondary.accent.hover,
  ),
}))

const outlineVariants = createVariants<ButtonVariant>((theme) => ({
  primary: outlineVariantStyles(
    theme.buttons.primary.high.onButton,
    theme.buttons.primary.high.rest,
    "transparent",
    theme.buttons.primary.high.hover,
  ),
  secondary: outlineVariantStyles(
    theme.buttons.primary.medium.onOutline,
    theme.buttons.primary.medium.rest,
    "transparent",
    theme.buttons.primary.medium.hover,
  ),
  tertiary: outlineVariantStyles(
    theme.text.medium,
    theme.buttons.secondary.low.borderRest,
    theme.buttons.secondary.low.rest,
    theme.buttons.secondary.low.hover,
  ),
  danger: outlineVariantStyles(
    theme.buttons.secondary.danger.onRest,
    theme.buttons.secondary.danger.onRest,
    theme.buttons.secondary.danger.rest,
    theme.buttons.secondary.danger.hover,
  ),
  emphasis: outlineVariantStyles(
    theme.buttons.secondary.emphasis.onRest,
    theme.buttons.secondary.emphasis.onRest,
    theme.buttons.secondary.emphasis.rest,
    theme.buttons.secondary.emphasis.hover,
  ),
  accent: outlineVariantStyles(
    theme.buttons.secondary.accent.onRest,
    theme.buttons.secondary.accent.onRest,
    theme.buttons.secondary.accent.rest,
    theme.buttons.secondary.accent.hover,
  ),
  success: outlineVariantStyles(
    theme.accents.success.emphasis,
    theme.accents.success.emphasis,
    "transparent",
    theme.accents.success.dim,
  ),
  transparent: outlineVariantStyles(
    theme.text.high,
    theme.colors.darkBlue.alpha[200],
    "transparent",
    theme.colors.darkBlue.alpha[200],
  ),
  muted: outlineVariantStyles(
    theme.text.medium,
    theme.buttons.secondary.low.borderRest,
    theme.buttons.outlineDark.rest,
    theme.buttons.secondary.low.hover,
  ),
  sliderTabActive: outlineVariantStyles(
    theme.buttons.primary.medium.onOutline,
    theme.buttons.primary.medium.rest,
    "transparent",
    theme.buttons.primary.medium.hover,
  ),
  sliderTabInactive: outlineVariantStyles(
    theme.text.medium,
    "none",
    "transparent",
    theme.buttons.secondary.low.hover,
  ),
  restSubtle: outlineVariantStyles(
    theme.buttons.secondary.low.onRest,
    "transparent",
    "transparent",
    theme.buttons.outlineDark.hover,
  ),
}))

const glowVariants = createVariants<ButtonVariant>((theme) => ({
  primary: blowVariantStyles(
    theme.buttons.primary.high.rest,
    theme.buttons.primary.high.dim,
  ),
  secondary: blowVariantStyles(
    theme.buttons.primary.medium.rest,
    theme.buttons.primary.medium.outlineHover,
  ),
  tertiary: blowVariantStyles(
    theme.buttons.secondary.low.borderRest,
    theme.buttons.secondary.low.hover,
  ),
  danger: blowVariantStyles(
    theme.buttons.secondary.danger.onRest,
    theme.buttons.secondary.danger.hover,
  ),
  emphasis: blowVariantStyles(
    theme.buttons.secondary.emphasis.onRest,
    theme.buttons.secondary.emphasis.hover,
  ),
  accent: blowVariantStyles(
    theme.buttons.secondary.accent.onRest,
    theme.buttons.secondary.accent.hover,
  ),
  success: blowVariantStyles(
    theme.accents.success.onEmphasis,
    theme.accents.success.emphasis,
  ),
  muted: blowVariantStyles(
    theme.buttons.secondary.low.borderRest,
    theme.buttons.outlineDark.rest,
  ),
  transparent: css``,
  sliderTabActive: css``,
  sliderTabInactive: css``,
  restSubtle: css``,
}))

const sizes = createVariants<ButtonSize>((theme) => ({
  small: css`
    line-height: 1.2;
    height: 1.875rem;
    font-size: ${theme.fontSizes.p6};
    padding: ${theme.space.base} ${theme.buttons.paddings.primary};
  `,
  medium: css`
    line-height: 1.2;
    height: 2.5rem;
    font-size: ${theme.fontSizes.p5};
    padding: ${theme.space.base} ${theme.buttons.paddings.primary};
  `,
  large: css`
    line-height: 1;
    height: 3.125rem;
    font-size: ${theme.fontSizes.p3};
    padding: ${theme.buttons.paddings.primary} ${theme.space.xl};
  `,
}))

export const SButton = styled(Box, {
  shouldForwardProp: (prop) =>
    !["variant", "size", "outline", "blur", "glow"].includes(prop),
})<SButtonProps>(
  defaulStyles,
  ({
    variant = "primary",
    size = "small",
    outline = false,
    blur = false,
    glow = false,
  }) => [
    sizes(size),
    outline ? outlineVariants(variant) : variants(variant),
    blur ? blurStyles : undefined,
    glow ? glowVariants(variant) : undefined,
  ],
  disabledStyles,
)

export const SDefaultButton = styled(Box, {
  shouldForwardProp: (prop) => !["variant", "size", "outline"].includes(prop),
})<SButtonProps>(
  defaulStyles,
  ({ size = "small" }) => [sizes(size)],
  disabledStyles,
)

export const SButtonTransparent = styled.button`
  background: transparent;

  margin: 0;
  padding: 0;
  border: none;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  &[disabled] {
    cursor: unset;
  }
`

export const SMicroButton = styled(Box)<{ variant?: MicroButtonVariant }>(
  ({ theme, variant = "low" }) => [
    css`
      all: unset;

      display: grid;
      grid-auto-flow: column;
      column-gap: ${theme.space.s};
      align-items: center;
      place-content: center;

      cursor: pointer;

      padding: ${theme.space.xs} ${theme.space.base};

      font-family: ${theme.fontFamilies1.secondary};
      font-size: ${theme.fontSizes.p6};
      font-weight: 500;
      line-height: 1;
      text-transform: uppercase;

      transition: ${theme.transitions.colors}, ${theme.transitions.opacity};

      border: 1px solid;
      border-radius: ${theme.containers.cornerRadius.buttonsPrimary};

      &:disabled {
        cursor: not-allowed;

        opacity: 0.3;
      }
    `,
    microVariants(variant),
  ],
)

export const SButtonIcon = styled(Box)(
  ({ theme }) => css`
    position: relative;

    padding: ${theme.space.base};

    display: flex;
    justify-content: center;
    align-items: center;

    color: ${theme.icons.onContainer};
    border-radius: ${theme.radii.full};
    cursor: pointer;

    transition: ${theme.transitions.colors}, ${theme.transitions.opacity};

    &:hover {
      background: ${theme.controls.dim.hover};
    }

    &[data-state="open"],
    &:active {
      color: ${theme.icons.primary};
    }

    &[disabled] {
      cursor: unset;
    }
  `,
)

export type LoadingMode = "inline" | "replace"

const LOADING_TRANSITION_MS = 500
const LOADING_ENTER_DELAY_MS = 150
const LOADING_ICON_EASING = "cubic-bezier(0.2, 0, 0, 1)"

const loadingLabelStyles = createStyles(
  (theme) => css`
    & > [data-loading-spinner],
    & > [data-loading-content] {
      display: inline-grid;
      grid-auto-flow: column;
      column-gap: ${theme.space.base};
      place-items: center;
    }

    & > [data-loading-spinner] svg {
      width: 1em;
      height: 1em;

      animation-play-state: paused;
    }

    [aria-busy="true"] > & > [data-loading-spinner] svg {
      animation-play-state: running;
    }

    [aria-busy="true"] > &&,
    [aria-busy="true"] > && > * {
      transition-delay: ${LOADING_ENTER_DELAY_MS}ms;
    }
  `,
)

const loadingLabelVariants = createVariants<LoadingMode>((theme) => ({
  inline: css`
    --loading-spinner-space: calc(1em + ${theme.space.base});

    position: relative;
    display: inline-grid;

    transition:
      transform ${LOADING_TRANSITION_MS}ms ${theme.easings.outExpo},
      margin ${LOADING_TRANSITION_MS}ms ${theme.easings.outExpo};

    & > [data-loading-spinner] {
      position: absolute;
      top: 50%;
      left: 0;

      width: 1em;
      height: 1em;

      opacity: 0;
      filter: blur(4px);
      transform: translate(
          calc(-100% - ${theme.space.base} + ${theme.space.s}),
          -50%
        )
        scale(0.25);

      transition:
        opacity ${LOADING_TRANSITION_MS}ms ${LOADING_ICON_EASING},
        transform ${LOADING_TRANSITION_MS}ms ${LOADING_ICON_EASING},
        filter ${LOADING_TRANSITION_MS}ms ${LOADING_ICON_EASING};
    }

    [aria-busy="true"] > & {
      margin-inline: calc(var(--loading-spinner-space) / 2);
      transform: translateX(calc(var(--loading-spinner-space) / 2));
    }

    [aria-busy="true"] > & > [data-loading-spinner] {
      opacity: 1;
      filter: blur(0);
      transform: translate(calc(-100% - 0.5em), -50%) scale(1);
    }
  `,
  replace: css`
    display: grid;
    overflow: hidden;

    line-height: 1.4;

    & > * {
      grid-area: 1 / 1;
      align-self: stretch;
      justify-self: center;

      transition:
        transform ${LOADING_TRANSITION_MS}ms ${theme.easings.outExpo},
        opacity ${LOADING_TRANSITION_MS}ms ${theme.easings.outExpo};
    }

    & > [data-loading-content] {
      opacity: 1;
    }

    & > [data-loading-spinner] {
      opacity: 0;
    }

    [aria-busy="true"] > & > [data-loading-content] {
      opacity: 0;
    }

    [aria-busy="true"] > & > [data-loading-spinner] {
      opacity: 1;
    }

    & > [data-loading-spinner] {
      transform: translateY(100%);
    }

    [aria-busy="true"] > & > [data-loading-content] {
      transform: translateY(-100%);
    }

    [aria-busy="true"] > & > [data-loading-spinner] {
      transform: translateY(0);
    }
  `,
}))

export const SLoadingLabel = styled.span<{ loadingMode: LoadingMode }>(
  loadingLabelStyles,
  ({ loadingMode }) => loadingLabelVariants(loadingMode),
)
