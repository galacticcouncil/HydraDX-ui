import { Flex, MenuSelectionItem } from "@galacticcouncil/ui/components"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

export const SHoverActions = styled(Flex)(
  () => css`
    @media (hover: hover) {
      opacity: 0;
      transition: opacity 0.15s ease-in-out;

      ${MenuSelectionItem}:hover & {
        opacity: 1;
      }
    }
  `,
)

export const SUserMenuAnchor = styled.div(
  ({ theme }) => css`
    display: inline-flex;
    align-items: center;
    position: relative;
    height: ${pxToRem(36)};

    &::before {
      content: "";
      position: absolute;
      inset: -${theme.space.s};
    }

    & > * {
      position: relative;
      z-index: 1;
    }
  `,
)
