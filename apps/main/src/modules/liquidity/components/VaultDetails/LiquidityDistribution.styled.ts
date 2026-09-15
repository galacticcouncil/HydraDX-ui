import { Flex } from "@galacticcouncil/ui/components"
import { css, styled } from "@galacticcouncil/ui/utils"

export const SLiquidityLegend = styled(Flex)(
  ({ theme }) => css`
    column-gap: ${theme.space.xl};
    row-gap: ${theme.space.s};
  `,
)

export const SRangeLegendToggle = styled(Flex)(
  ({ theme }) => css`
    cursor: pointer;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    border-radius: ${theme.radii.base};

    &:focus-visible {
      outline: 2px solid ${theme.controls.outline.active};
      outline-offset: 2px;
    }
  `,
)

export const SManagedBand = styled(Flex, {
  shouldForwardProp: (prop) =>
    prop !== "$rangeColor" &&
    prop !== "$fillOpacity" &&
    prop !== "$borderOpacity" &&
    prop !== "$opacity",
})<{
  $rangeColor: string
  $fillOpacity: number
  $borderOpacity: number
  $opacity?: number
}>(
  ({ $rangeColor, $fillOpacity, $borderOpacity, $opacity = 1 }) => css`
    z-index: 1;
    opacity: ${$opacity};
    background: color-mix(
      in srgb,
      ${$rangeColor} ${$fillOpacity * 100}%,
      transparent
    );
    border: 1px solid
      color-mix(in srgb, ${$rangeColor} ${$borderOpacity * 100}%, transparent);
    pointer-events: none;
    transition:
      left 650ms ease-in-out,
      width 650ms ease-in-out,
      background 650ms ease-in-out,
      border-color 650ms ease-in-out,
      opacity 650ms ease-in-out;
  `,
)

export const SSpotLine = styled(Flex)(css`
  z-index: 2;
  pointer-events: none;
  transition: left 650ms ease-in-out;
`)
