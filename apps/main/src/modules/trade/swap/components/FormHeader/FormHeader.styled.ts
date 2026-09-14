import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Box, Flex } from "@galacticcouncil/ui/components"

export const SHeaderTab = styled(Box)<{ readonly disabled?: boolean }>(
  ({ theme, disabled }) => css`
    color: ${theme.text.low};

    padding-block: ${theme.space.base};
    padding-inline: ${theme.space.l};
    border-radius: ${theme.radii.xxl};

    font-weight: 500;
    font-size: ${theme.fontSizes.p3};
    line-height: ${theme.lineHeights.m};
    text-decoration: none;

    cursor: pointer;

    transition: ${theme.transitions.colors};

    ${disabled &&
    css`
      pointer-events: none;
    `}

    &:hover {
      color: ${theme.text.high};
    }

    &[data-status="active"] {
      color: ${theme.text.high};
      background: ${theme.buttons.secondary.low.rest};
    }
  `,
)

export const SFormHeader = styled(Flex)(
  ({ theme }) => css`
    padding: ${theme.containers.paddings.secondary} 0;
  `,
)
