import styled from "@emotion/styled"
import { Button } from "components/Button/Button"
import { theme } from "theme"

export const SHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  aligh-items: start;

  padding: 15px 12px;
  margin: -15px -12px 0;

  background: rgba(0, 5, 35, 0.2);

  @media ${theme.viewport.gte.sm} {
    flex-direction: row;
    aligh-items: center;

    padding-bottom: 0 0 16px 0;

    background: transparent;
  }
`

export const SButton = styled(Button)`
  @media ${theme.viewport.gte.sm} {
    min-width: 140px;
  }
`

export const SSearchContainer = styled.div`
  position: relative;

  & > svg {
    position: absolute;

    top: 50%;
    left: 12px;

    transform: translateY(-50%);

    color: rgba(${theme.rgbColors.white}, 0.4);
  }

  input[type="text"] {
    background: rgba(158, 167, 186, 0.06);

    &:not(:hover):not(:focus) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    padding-left: 48px;

    &::placeholder {
      color: rgba(${theme.rgbColors.white}, 0.4);
    }
  }
`
