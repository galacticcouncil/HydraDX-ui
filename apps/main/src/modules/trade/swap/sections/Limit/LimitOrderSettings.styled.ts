import { css } from "@emotion/react"
import styled from "@emotion/styled"

export const SBulletList = styled.ul(
  ({ theme }) => css`
    list-style-type: disc;
    padding-left: ${theme.space.l};
    margin: 0;
    font-size: ${theme.fontSizes.p5};
    line-height: 1.4;

    li + li {
      margin-top: ${theme.space.s};
    }
  `,
)
