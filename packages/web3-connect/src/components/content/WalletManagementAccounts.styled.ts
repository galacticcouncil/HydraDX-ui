import { Box, Flex, Image, Text } from "@galacticcouncil/ui/components"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

const roundMark = (size: number) => css`
  width: ${pxToRem(size)};
  height: ${pxToRem(size)};
  border-radius: 9999px;
  flex-shrink: 0;
  object-fit: contain;
`

export const SSectionLogo = styled(Image)`
  ${roundMark(16)}
`

export const SAccountModeIcon = styled(Image)`
  ${roundMark(12)}
`

export const SAccountTile = styled(Box)(
  ({ theme }) => css`
    width: 100%;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: ${theme.space.base};

    padding: ${theme.space.base};

    border: 1px solid transparent;
    border-radius: ${theme.radii.m};
    background: ${theme.surfaces.containers.dim.dimOnBg};
    color: ${theme.text.high};

    cursor: pointer;
    overflow: hidden;
    transition: ${theme.transitions.colors};

    &:hover {
      background: ${theme.details.borders};
    }

    &:focus-visible {
      outline: 2px solid ${theme.buttons.secondary.accent.outline};
      outline-offset: 2px;
    }

    &[data-active="true"] {
      background: ${theme.buttons.secondary.outline.fill};
      border-color: ${theme.buttons.secondary.outline.outline};
    }

    /* the change-account button sits flush underneath */
    &[data-has-change-account="true"] {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  `,
)

export const SAccountTileBody = styled(Flex)(
  () => css`
    flex-direction: column;
    min-width: 0;
    flex: 1;
  `,
)

export const SAccountTileRow = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space.base};
    min-width: 0;
  `,
)

export const SAccountTileBalance = styled(Text)`
  flex-shrink: 0;
`

export const SAccountTileCopyButton = styled(Box)(
  ({ theme }) => css`
    color: ${theme.text.medium};
    cursor: pointer;
    flex-shrink: 0;

    mnargin-left: auto;

    &[data-copied="true"] {
      color: ${theme.accents.success.emphasis};
    }

    &:hover:not(:disabled) {
      color: ${theme.text.high};
    }
  `,
)

export const STruncatingRow = styled(Flex)`
  align-items: center;
  width: 100%;
  min-width: 0;
`

export const STruncatingText = styled(Text)`
  min-width: 0;
`
