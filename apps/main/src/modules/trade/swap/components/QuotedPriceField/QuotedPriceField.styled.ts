import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { NumberInput } from "@galacticcouncil/ui/components"
import { NumericFormat } from "react-number-format"

import { AssetLogo } from "@/components/AssetLogo"

export const SPriceInput = styled(NumberInput)(
  ({ theme }) => css`
    font-weight: 600;
    font-size: ${theme.fontSizes.p2};
    color: ${theme.text.high};
    flex: 1;
    text-align: right;
    padding-right: 0;
  `,
)

type PillTone = "neutral" | "positive" | "negative"

export const SCustomPill = styled.div<{
  isActive?: boolean
  tone?: PillTone
}>(({ theme, isActive, tone = "neutral" }) => {
  const idleNeutral = css`
    color: ${theme.text.low};
    background: ${theme.buttons.secondary.low.rest};
    border: 1px solid ${theme.buttons.secondary.low.borderRest};

    ${SPillSeparator} {
      background: ${theme.buttons.secondary.low.borderRest};
    }

    &:hover {
      background: ${theme.buttons.secondary.low.hover};
    }
  `

  const activeNeutral = css`
    cursor: default;
    color: ${theme.buttons.secondary.accent.onRest};
    background: ${theme.buttons.secondary.accent.rest};
    border: 1px solid ${theme.buttons.secondary.accent.outline};

    ${SPillSeparator} {
      background: ${theme.buttons.secondary.accent.outline};
    }

    &:hover {
      background: ${theme.buttons.secondary.accent.hover};
    }
  `

  const idleByTone =
    tone === "positive"
      ? css`
          color: ${theme.accents.success.emphasis};
          background: ${theme.accents.success.dim};
          border: 1px solid ${theme.accents.success.emphasis};

          ${SPillSeparator} {
            background: ${theme.accents.success.emphasis};
          }

          &:hover {
            filter: brightness(1.2);
          }
        `
      : tone === "negative"
        ? css`
            color: ${theme.accents.danger.secondary};
            background: ${theme.accents.danger.dimBg};
            border: 1px solid ${theme.accents.danger.secondary};

            ${SPillSeparator} {
              background: ${theme.accents.danger.secondary};
            }

            &:hover {
              filter: brightness(1.2);
            }
          `
        : idleNeutral

  const activeByTone =
    tone === "positive"
      ? css`
          color: ${theme.accents.success.emphasis};
          background: ${theme.accents.success.dim};
          border: ${theme.scales.border.base} solid
            ${theme.accents.success.emphasis};
        `
      : tone === "negative"
        ? css`
            color: ${theme.accents.danger.secondary};
            background: ${theme.accents.danger.dimBg};
            border: ${theme.scales.border.base} solid
              ${theme.accents.danger.emphasis};
          `
        : activeNeutral

  return css`
    box-sizing: border-box;
    display: inline-flex;
    align-items: stretch;

    padding: 0 ${theme.space.base};

    height: ${theme.sizes.l};

    border-radius: ${theme.radii.full};

    font-size: ${theme.fontSizes.p6};
    font-weight: 500;
    line-height: 1;

    transition: ${theme.transitions.colors};

    ${isActive ? activeByTone : idleByTone}
  `
})

export const SPillActions = styled.div(
  ({ theme }) => css`
    display: inline-flex;
    align-items: stretch;
    flex-shrink: 0;
    align-self: stretch;
    margin-left: ${theme.space.s};
    margin-right: ${theme.space["-base"]};
    svg {
      width: 0.675rem;
      height: 0.675rem;
    }
  `,
)

export const SPillTrigger = styled.button(
  ({ theme }) => css`
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    align-self: center;
    min-width: 0;
    color: inherit;
    font: inherit;
    line-height: inherit;

    &:focus-visible {
      border-radius: ${theme.radii.full};
      outline: ${theme.space.xs} solid ${theme.controls.outline.active};
      outline-offset: ${theme.scales.border.base};
    }
  `,
)

export const SPercentSuffix = styled.span(
  ({ theme }) => css`
    align-self: center;
    margin-left: ${theme.space.xs};
  `,
)

export const SPillSeparator = styled.span(
  ({ theme }) => css`
    flex-shrink: 0;
    align-self: stretch;
    width: ${theme.scales.border.base};
    margin-left: ${theme.space.s};
    width: 1px;
    background: ${theme.controls.outline.base};
  `,
)

export const SPillSliceButton = styled.button(
  ({ theme }) => css`
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex: 0 0
      calc(${theme.sizes.xl} + ${theme.space.xs} + ${theme.scales.border.base});
    align-items: center;
    align-self: stretch;
    justify-content: center;
    width: calc(
      ${theme.sizes.xl} + ${theme.space.xs} + ${theme.scales.border.base}
    );
    line-height: 0;
    padding: 0 ${theme.space.xs};
    border-radius: 0 ${theme.radii.full} ${theme.radii.full} 0;
    color: inherit;
    background: transparent;
    transition: ${theme.transitions.colors};

    &:focus-visible {
      outline: ${theme.space.xs} solid ${theme.controls.outline.active};
      outline-offset: calc(-1 * ${theme.scales.border.base});
    }
  `,
)

export const SPillInlineInput = styled(NumericFormat)(
  ({ theme }) => css`
    all: unset;
    width: ${theme.sizes["2xl"]};
    align-self: center;
    height: 1em;
    flex-shrink: 0;
    text-align: right;
    font: inherit;
    padding-right: ${theme.space.xs};

    &::placeholder {
      color: ${theme.text.low};
      opacity: 1;
    }

    &:focus::placeholder {
      color: transparent;
    }
  `,
)

export const SInlineAssetLogo = styled(AssetLogo)`
  display: inline-flex;
  margin-inline: 0.1em;
`
export const SMarketPrice = styled.span`
  text-decoration: underline dotted;
  text-underline-offset: 0.15em;
`

export const SMarketButton = styled.button(
  ({ theme }) => css`
    all: unset;
    cursor: pointer;
    font-size: ${theme.fontSizes.p5};
    font-weight: 500;
    line-height: 1.2;
    color: ${theme.text.medium};
    transition: ${theme.transitions.colors};

    &:hover {
      color: ${theme.text.high};
    }
  `,
)
