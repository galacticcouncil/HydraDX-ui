import { Box } from "@galacticcouncil/ui/components"
import { containerSize, css, pxToRem, styled } from "@galacticcouncil/ui/utils"

const itemStyles = css`
  position: relative;
  min-width: 0;
  width: 100%;
`

export const SAssetProgressStat = styled(Box)(
  () => css`
    ${itemStyles}
  `,
)

export const SAssetProgressStatGrid = styled(Box)(
  () => css`
    ${itemStyles}

    ${containerSize(
      "md",
      css`
        width: ${pxToRem(160)};
      `,
    )}
  `,
)

export const SAssetProgressStatProgress = styled(Box)(
  ({ theme }) => css`
    position: absolute;
    top: calc(100% - ${theme.space.m});
    left: 0;
    right: 0;
    max-width: ${pxToRem(180)};
  `,
)
