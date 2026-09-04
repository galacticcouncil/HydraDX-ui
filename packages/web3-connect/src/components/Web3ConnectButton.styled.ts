import { Button, Text } from "@galacticcouncil/ui/components"
import { css, styled } from "@galacticcouncil/ui/utils"

export const SConnectedButton = styled(Button)(
  ({ theme }) => css`
    background: ${theme.buttons.outlineDark.rest};
    gap: ${theme.space.base};
    padding: ${theme.space.base};

    &:not(:disabled):hover,
    &:not(:disabled):active {
      background: ${theme.buttons.outlineDark.hover};
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
