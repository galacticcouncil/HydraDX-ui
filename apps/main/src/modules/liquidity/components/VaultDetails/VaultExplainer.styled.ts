import { Flex } from "@galacticcouncil/ui/components"
import { containerQuery, css, styled } from "@galacticcouncil/ui/utils"

export const SChartPreview = styled(Flex)(css`
  flex: 7;
  min-width: 0;
  pointer-events: none;

  ${containerQuery(
    { conditions: [{ type: "inline-size", value: "36rem" }] },
    css`
      align-self: flex-start;
    `,
  )}
`)

export const SExplainerSplit = styled(Flex)(css`
  flex-direction: column;
  align-items: stretch;

  ${containerQuery(
    { conditions: [{ type: "inline-size", value: "36rem" }] },
    css`
      flex-direction: row;
    `,
  )}
`)

export const SExplainerSplitDivider = styled.div(
  ({ theme }) => css`
    align-self: stretch;
    width: auto;
    height: 1px;
    margin-block: ${theme.space.l};
    background: ${theme.details.separators};

    ${containerQuery(
      { conditions: [{ type: "inline-size", value: "36rem" }] },
      css`
        width: 1px;
        height: auto;
        margin-block: 0;
        margin-inline: ${theme.space.xl};
      `,
    )}
  `,
)

export const SScenarioPanel = styled(Flex)(
  ({ theme }) => css`
    flex: 5;
    min-width: 0;
    animation-name: ${theme.animations.fadeIn};
    animation-duration: 650ms;
    animation-timing-function: ease-in-out;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
)
