import styled from "@emotion/styled"
import { theme } from "theme"
import memepadImage from "assets/images/memepad.webp"
import memepadImage2x from "assets/images/memepad@2x.webp"
import memepadImageMobile from "assets/images/memepad-mobile.webp"

export const SContainer = styled.div`
  position: absolute;

  right: 20px;
  top: 0;

  pointer-events: none;

  @media ${theme.viewport.gte.sm} {
    position: relative;

    margin-top: -200px;
    margin-left: 80px;
  }

  @media ${theme.viewport.gte.md} {
    width: 100%;
    height: auto;

    max-width: 350px;
    aspect-ratio: 350 / 500;
  }

  & > div img {
    position: absolute;
  }

  & > div:nth-of-type(3) img {
    top: 0;
    left: 0;
  }

  & > div:nth-of-type(2) img {
    top: 220px;
    right: 0;
  }

  & > div:nth-of-type(1) img {
    top: 360px;
    left: 50px;
  }
`

export const SBottleCaps = styled.div`
  position: relative;

  max-width: 100%;

  width: 75px;
  height: 100px;

  background-size: 100%;
  background-position: top;
  background-repeat: no-repeat;
  background-image: url(${memepadImageMobile});

  @media ${theme.viewport.gte.sm} {
    width: 100%;
    height: auto;

    max-width: 350px;
    aspect-ratio: 350 / 500;

    background-image: url(${memepadImage});

    @media only screen and (min-device-pixel-ratio: 2),
      only screen and (min-resolution: 2dppx) {
      background-image: url(${memepadImage2x});
    }
  }
`
