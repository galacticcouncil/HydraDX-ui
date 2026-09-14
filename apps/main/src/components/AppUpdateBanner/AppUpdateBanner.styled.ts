import { Flex, SAdvanceButton } from "@galacticcouncil/ui/components"
import { mq } from "@galacticcouncil/ui/theme"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

export const SAppUpdateBannerContainer = styled(Flex)(
  ({ theme }) => css`
    position: fixed;
    left: ${theme.space.m};
    right: ${theme.space.m};
    z-index: ${theme.zIndices.modal};

    bottom: ${pxToRem(70)};

    pointer-events: none;

    ${mq("lg")} {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      bottom: ${theme.space.l};
    }
  `,
)

export const SAppUpdateBanner = styled(Flex)(
  ({ theme }) => css`
    pointer-events: auto;

    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space.l};

    padding: ${theme.space.m};

    border-radius: ${theme.radii.m};

    font-size: ${theme.fontSizes.p4};
    font-weight: 500;

    background: ${theme.colors.azureBlue[300]};
    color: ${theme.colors.darkBlue[900]};

    box-shadow: 2px 2px 5px 0px rgba(41, 41, 60, 0.15);

    animation: ${theme.animations.fadeInBottom} 600ms ${theme.easings.outBack}
      both;

    ${mq("lg")} {
      padding-right: ${theme.space.base};
      padding-block: ${theme.space.base};
      padding-left: ${theme.space.l};
    }
  `,
)

export const SAppUpdateReloadButton = styled(SAdvanceButton)(
  ({ theme }) => css`
    padding-inline: ${theme.space.l};
    padding-block: ${theme.space.base};
    border-radius: ${theme.radii.full};
  `,
)
