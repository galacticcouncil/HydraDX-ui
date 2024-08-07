import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div``

export const SHeading = styled.h1`
  color: ${theme.colors.white};
  text-transform: uppercase;
  line-height: 1.2;
  font-family: "GeistMono";
  font-weight: 100;

  border-bottom: 1px solid rgba(${theme.rgbColors.darkBlue100}, 0.2);
  padding-bottom: 14px;
  margin-bottom: 20px;

  & > span {
    background: ${theme.gradients.pinkLightPink};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`
