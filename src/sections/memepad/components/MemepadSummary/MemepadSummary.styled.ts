import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div`
  position: relative;

  width: 100%;
  max-width: 700px;

  margin: 0 auto;

  @media ${theme.viewport.gte.sm} {
    padding: 0 50px;
  }
`

export const SHeading = styled.div`
  position: relative;

  margin-bottom: 30px;
  padding-bottom: 20px;

  border-bottom: 1px solid rgba(${theme.rgbColors.darkBlue100}, 0.2);

  svg {
    position: absolute;
    display: none;

    @media ${theme.viewport.gte.sm} {
      display: block;
    }
  }

  svg:nth-of-type(1) {
    bottom: 20px;
    left: 0;
  }

  svg:nth-of-type(2) {
    top: 0;
    right: 0;
  }
`
export const SRowItem = styled.div`
  display: flex;
  gap: 20;
  justify-content: space-between;

  padding: 5px 0;

  border-bottom: 1px solid rgba(${theme.rgbColors.darkBlue400}, 0.3);
`
