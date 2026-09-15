import { Box, Flex } from "@galacticcouncil/ui/components"
import { containerSize, css, styled } from "@galacticcouncil/ui/utils"

export const SDetailsStatsContainer = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    gap: ${theme.space.m};
    padding: ${theme.space.l};

    ${containerSize(
      "sm",
      css`
        flex-direction: row;
        align-items: center;
        gap: ${theme.space.xxxl};
      `,
    )}
  `,
)

export const SDetailsStatsSeparator = styled(Box)(
  ({ theme }) => css`
    flex-shrink: 0;
    align-self: stretch;
    height: 1px;
    background: ${theme.details.separators};

    ${containerSize(
      "sm",
      css`
        width: 1px;
        height: auto;
      `,
    )}
  `,
)

export const SDetailsStatItem = styled(Box)(
  () => css`
    min-width: 0;
    width: 100%;

    ${containerSize(
      "sm",
      css`
        width: auto;
      `,
    )}
  `,
)
