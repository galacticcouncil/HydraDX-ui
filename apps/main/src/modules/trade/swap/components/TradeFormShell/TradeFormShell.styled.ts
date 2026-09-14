import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Flex } from "@galacticcouncil/ui/components"

export const STradeFormShell = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;

    & > * + * {
      position: relative;
    }

    & > * + *::before {
      content: "";

      position: absolute;
      top: 0;
      right: var(--swap-section-inset-inline);
      left: var(--swap-section-inset-inline);

      border-top: 1px solid ${theme.details.separators};
    }
  `,
)
