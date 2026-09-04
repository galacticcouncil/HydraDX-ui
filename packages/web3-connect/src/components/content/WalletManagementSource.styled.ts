import { Box, Flex, Image } from "@galacticcouncil/ui/components"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

/** Styles for the rows of the wallet-source column. */
/** A round, contained image mark. Sizes are named by role at each use site. */
const roundMark = (size: number) => css`
  width: ${pxToRem(size)};
  height: ${pxToRem(size)};
  border-radius: 9999px;
  flex-shrink: 0;
  object-fit: contain;
`

/**
 * One row in the wallet-source column. The three variants are driven by
 * `data-variant` so the button stays a plain element with no variant prop
 * threaded through it.
 */
export const SSourceButton = styled.button(
  ({ theme }) => css`
    width: 100%;
    min-height: ${pxToRem(40)};

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${pxToRem(4)};

    padding: ${theme.space.base};

    border: 1px solid transparent;
    border-radius: ${theme.radii.m};
    background: transparent;
    color: ${theme.text.high};

    cursor: pointer;
    transition: ${theme.transitions.colors};

    &:not([data-variant="firstConnectionPlain"]) {
      background: ${theme.surfaces.containers.dim.dimOnBg};

      &:hover {
        background: ${theme.buttons.secondary.accent.restSubtle};
        border-color: ${theme.buttons.secondary.accent.outline};
      }
    }

    &[data-variant="firstConnection"] {
      min-height: ${pxToRem(40)};
      padding: ${theme.space.base};
    }

    &[data-variant="firstConnectionPlain"] {
      width: auto;
      min-height: ${pxToRem(36)};
      align-self: flex-start;
      justify-content: flex-start;
      gap: ${pxToRem(6)};
      padding: ${theme.space.s} ${theme.space.base};
      background: transparent;

      &:hover {
        background: ${theme.buttons.secondary.accent.restSubtle};
      }
    }

    &[data-active="true"] {
      background: ${theme.buttons.secondary.accent.rest};
      border-color: ${theme.buttons.secondary.accent.outline};

      &:hover {
        background: ${theme.buttons.secondary.accent.hover};
      }
    }
  `,
)

export const SSourceButtonContent = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    gap: ${theme.space.base};
    min-width: 0;
    flex: 1;
  `,
)

export const SSourceButtonEnd = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    gap: ${theme.space.s};
    flex-shrink: 0;
  `,
)

export const SSourceIcon = styled(Box)(
  ({ theme }) => css`
    width: ${pxToRem(20)};
    height: ${pxToRem(20)};
    border-radius: ${theme.radii.full};

    background: ${theme.buttons.secondary.outline.fill};
    color: ${theme.text.high};

    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
)

/** A source row's own logo. Square-ish brand marks stay unrounded. */
export const SSourceLogo = styled(Image)`
  width: ${pxToRem(20)};
  height: ${pxToRem(20)};
  flex-shrink: 0;
  object-fit: contain;
`

export const SStackedSourceLogos = styled(Flex)`
  flex-shrink: 0;
`

/** Group logos stack with a 4px overlap when a brand has several wallets. */
export const SStackedSourceLogo = styled(Image)`
  ${roundMark(14)}

  & + & {
    margin-left: ${pxToRem(-4)};
  }
`

export const SSourceChainBadges = styled(Flex)`
  align-items: center;
  flex-shrink: 0;
`

/**
 * Badges overlap by 5px. The offset is a sibling rule rather than an index
 * prop, so the render does not have to count.
 */
export const SSourceChainBadge = styled(Box)(
  ({ theme }) => css`
    width: ${pxToRem(18)};
    height: ${pxToRem(18)};
    border-radius: ${theme.radii.full};

    background: ${theme.surfaces.containers.high.primary};

    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    & + & {
      margin-left: ${pxToRem(-5)};
    }
  `,
)

export const SChainBadgeImage = styled(Image)`
  ${roundMark(12)}
`

export const SSourceAction = styled(Box)(
  ({ theme }) => css`
    width: ${pxToRem(24)};
    height: ${pxToRem(24)};
    border-radius: ${pxToRem(4)};

    color: ${theme.text.medium};
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: ${theme.controls.dim.hover};
      color: ${theme.text.high};
    }
  `,
)

/** Shrink-wrapped text columns: the guard against a flex child refusing to truncate. */
export const STruncatingColumn = styled(Flex)`
  flex-direction: column;
  min-width: 0;
`
