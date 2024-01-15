import styled from "@emotion/styled"
import { theme } from "theme"
import { SContainerVertical } from "sections/stats/StatsPage.styled"

export const SBurnContainer = styled(SContainerVertical)`
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  padding: 40px;

  @media (${theme.viewport.gte.sm}) {
    flex-direction: row;

    & > div:nth-of-type(1) {
      order: 2;
    }
    & > div:nth-of-type(2) {
      order: 1;
    }
    & > div:nth-of-type(3) {
      order: 3;
    }
  }

  & p {
    text-align: center;
  }
`
