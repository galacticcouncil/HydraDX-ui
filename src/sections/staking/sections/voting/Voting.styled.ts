import styled from "@emotion/styled"
import { Box } from "components/Box/Box.styled"
import { theme } from "theme"

export const SVotingBox = styled(Box)`
  padding: 16px 12px;

  border-radius: ${theme.borderRadius.stakingCard}px;

  :before {
    border-radius: ${theme.borderRadius.stakingCard}px;
  }

  @media (${theme.viewport.gte.sm}) {
    padding: 18px 28px;
  }
`

export const SDetailsBox = styled(Box)`
  padding: 18px 12px 18px;

  box-shadow: none;

  width: 100%;

  border-radius: ${theme.borderRadius.stakingCard}px;

  background: linear-gradient(0deg, rgba(6, 9, 23, 0.4), rgba(6, 9, 23, 0.4));

  :before {
    border-radius: ${theme.borderRadius.stakingCard}px;

    background: linear-gradient(
      180deg,
      rgba(152, 176, 214, 0.27) 0%,
      rgba(163, 177, 199, 0.15) 66.67%,
      rgba(158, 167, 180, 0.2) 100%
    );
  }
  @media (${theme.viewport.gte.sm}) {
    padding: 18px 28px 38px;
  }
`

export const SBage = styled.div`
  padding: 3px 8px;

  background: ${theme.colors.pink600};
  color: ${theme.colors.basic900};

  border-radius: 2px;
`
