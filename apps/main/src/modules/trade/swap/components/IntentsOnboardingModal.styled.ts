import { css } from "@emotion/react"
import styled from "@emotion/styled"
import IcePromo from "@galacticcouncil/ui/assets/images/IcePromo.webp"
import { mq } from "@galacticcouncil/ui/theme"
import { hexToRgba } from "@galacticcouncil/utils"

const PROMO_HEIGHT = "14rem"
const FADE_EXTENSION = "2rem"

export const SIntentsOnboardingHeader = styled.div(
  ({ theme }) => css`
    --promo-image-height: ${PROMO_HEIGHT};

    position: relative;
    overflow: hidden;

    margin-inline: var(--modal-content-inset);
    margin-top: calc(
      (
          var(--modal-content-padding) + var(--modal-header-button-size) +
            ${theme.space.xs}
        ) * -1
    );
    padding-inline: var(--modal-content-padding);
    padding-bottom: ${theme.space.xl};

    border-top-left-radius: ${theme.radii.xl};
    border-top-right-radius: ${theme.radii.xl};

    ${mq("max-xs")} {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: var(--promo-image-height);
      background-image: url(${IcePromo});
      background-size: cover;
      background-position: top center;
      background-repeat: no-repeat;
      mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
      -webkit-mask-image: linear-gradient(
        180deg,
        #000 0%,
        #000 72%,
        transparent 100%
      );
      mask-size: 100% 100%;
      -webkit-mask-size: 100% 100%;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: calc(var(--promo-image-height) + ${FADE_EXTENSION});
      pointer-events: none;

      background: linear-gradient(
        180deg,
        ${hexToRgba(theme.surfaces.themeBasePalette.surfaceHigh, 0)} 20%,
        ${hexToRgba(theme.surfaces.themeBasePalette.surfaceHigh, 0.75)} 75%,
        ${theme.surfaces.themeBasePalette.surfaceHigh} 92%,
        ${theme.surfaces.themeBasePalette.surfaceHigh} 100%
      );
    }
  `,
)

export const SIntentsOnboardingHeaderContent = styled.div`
  position: relative;
  z-index: 1;
  margin-top: calc(var(--promo-image-height) * 0.8);
`
