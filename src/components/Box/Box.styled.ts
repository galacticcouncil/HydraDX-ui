import styled from "@emotion/styled"
import { theme } from "theme"

export const Box = styled.div`
  border-radius: ${theme.borderRadius.default}px;

  background-color: ${theme.colors.darkBlue700};
  box-shadow: ${theme.shadows.contentBox};

  overflow: hidden;

  position: relative;

  :before {
    content: "";
    position: absolute;
    inset: 0;

    border-radius: ${theme.borderRadius.default}px;
    padding: 1px; // a width of the border

    background: linear-gradient(
      180deg,
      rgba(102, 151, 227, 0.35) 0%,
      rgba(68, 109, 174, 0.3) 66.67%,
      rgba(91, 151, 245, 0) 99.99%,
      rgba(158, 167, 180, 0) 100%
    );

    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  @media ${theme.viewport.gte.sm} {
    margin: unset;
    width: 100%;
  }
`
