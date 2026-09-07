import { Theme } from "@emotion/react"
import { Box, Flex, Image } from "@galacticcouncil/ui/components"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

const roundMark = (theme: Theme, size: string) => css`
  width: ${size};
  height: ${size};
  border-radius: ${theme.radii.full};
  flex-shrink: 0;
  object-fit: contain;
`

export const SSourceButton = styled.button(
  ({ theme }) => css`
    width: 100%;
    min-height: ${pxToRem(40)};

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space.s};

    padding: ${theme.space.base};
    padding-right: ${theme.space.s};

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
    gap: ${theme.space.xs};
    flex-shrink: 0;
  `,
)

export const SSourceIcon = styled(Box)(
  ({ theme }) => css`
    width: ${theme.sizes.l};
    height: ${theme.sizes.l};
    border-radius: ${theme.radii.full};

    background: ${theme.buttons.secondary.outline.fill};
    color: ${theme.text.high};

    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
)

export const SSourceLogo = styled(Image)(
  ({ theme }) => css`
    width: ${theme.sizes.l};
    height: ${theme.sizes.l};
    flex-shrink: 0;
    object-fit: contain;
  `,
)

export const SStackedSourceLogos = styled(Flex)`
  flex-shrink: 0;
`

export const SStackedSourceLogo = styled(Image)(
  ({ theme }) => css`
    ${roundMark(theme, theme.sizes.s)}

    & + & {
      margin-left: -${theme.space.s};
    }
  `,
)

export const SSourceChainBadges = styled(Flex)`
  align-items: center;
  flex-shrink: 0;
`

export const SSourceChainBadge = styled(Box)(
  ({ theme }) => css`
    width: ${theme.sizes["m"]};
    height: ${theme.sizes["m"]};
    border-radius: ${theme.radii.full};

    background: ${theme.surfaces.containers.high.primary};
    border: 1px solid ${theme.surfaces.containers.high.primary};

    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    & + & {
      margin-left: ${pxToRem(-5)};
    }
  `,
)

export const SChainBadgeImage = styled(Image)(
  ({ theme }) => css`
    ${roundMark(theme, theme.sizes.xs)}
  `,
)

export const SSourceAction = styled(Box)(
  ({ theme }) => css`
    width: ${theme.sizes.l};
    height: ${theme.sizes.l};
    border-radius: ${theme.radii.base};

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

export const STruncatingColumn = styled(Flex)`
  flex-direction: column;
  min-width: 0;
`

export const SConnectedSubtitle = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    gap: ${theme.space.xs};
    min-width: 0;
  `,
)

export const SConnectedDot = styled(Box)(
  ({ theme }) => css`
    width: ${theme.sizes["3xs"]};
    height: ${theme.sizes["3xs"]};
    border: 1px solid ${theme.accents.success.emphasis};
    background: ${theme.accents.success.emphasis};
    border-radius: ${theme.radii.full};
    box-sizing: content-box;
    flex-shrink: 0;
  `,
)
