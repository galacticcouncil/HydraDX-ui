import { Box, Button, Text } from "@galacticcouncil/ui/components"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

import { ProviderLogo } from "@/components/provider/ProviderLogo"

export const SAvatar = styled(Box)`
  position: relative;
  display: flex;
  flex-shrink: 0;
`

export const SProviderBadge = styled(ProviderLogo)(
  ({ theme }) => css`
    position: absolute;
    right: ${pxToRem(-2)};
    bottom: ${pxToRem(-2)};

    border: 1px solid ${theme.buttons.outlineDark.rest};
    border-radius: ${theme.radii.full};
    background: ${theme.buttons.outlineDark.rest};
  `,
)

export const SConnectedButton = styled(Button)(
  ({ theme }) => css`
    background: ${theme.buttons.outlineDark.rest};
    gap: ${theme.space.base};
    padding: ${theme.space.base};

    &:not(:disabled):hover,
    &:not(:disabled):active {
      background: ${theme.buttons.outlineDark.hover};

      ${SProviderBadge} {
        border-color: ${theme.buttons.outlineDark.hover};
        background: ${theme.buttons.outlineDark.hover};
      }
    }
  `,
)

export const SHoverText = styled(Text)(
  ({ theme }) => css`
    position: relative;
    & > span {
      transition: ${theme.transitions.opacity};
    }
    & > span:nth-child(1) {
      opacity: 1;
    }
    & > span:nth-child(2) {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
    }

    &:hover {
      & > span:nth-child(1) {
        opacity: 0;
      }
      & > span:nth-child(2) {
        opacity: 1;
      }
    }
  `,
)
