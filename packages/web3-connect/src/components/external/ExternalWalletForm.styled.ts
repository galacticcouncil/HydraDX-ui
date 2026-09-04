import { Box, ButtonIcon, Flex, Input } from "@galacticcouncil/ui/components"
import { css, styled } from "@galacticcouncil/ui/utils"

export const SExternalAddressInput = styled(Input)`
  min-width: 0;

  input {
    min-width: 0;
    text-overflow: ellipsis;
  }
`

export const SExternalAddressActionButton = styled(ButtonIcon)(
  ({ theme }) => css`
    flex-shrink: 0;
    padding: ${theme.space.xs};
    color: ${theme.text.medium};

    &:hover:not(:disabled) {
      color: ${theme.text.high};
    }
  `,
)

export const SSavedExternalWalletTile = styled(Flex)(
  ({ theme }) => css`
    padding: ${theme.space.base};
    border: 1px solid ${theme.details.borders};
    border-radius: ${theme.radii.m};
    background: ${theme.surfaces.containers.dim.dimOnBg};
    cursor: pointer;
    transition: ${theme.transitions.colors};

    &:hover {
      border-color: ${theme.buttons.secondary.outline.outline};
      background: ${theme.buttons.secondary.outline.fill};
    }
  `,
)

export const SSavedExternalWalletCopyButton = styled(Box)(
  ({ theme }) => css`
    display: flex;
    flex-shrink: 0;
    cursor: pointer;
    color: ${theme.text.medium};

    &[data-copied="true"] {
      color: ${theme.accents.success.emphasis};
    }

    &:hover:not(:disabled) {
      color: ${theme.text.high};
    }
  `,
)
