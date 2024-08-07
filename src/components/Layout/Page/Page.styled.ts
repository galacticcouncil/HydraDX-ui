import styled from "@emotion/styled"
import { theme } from "theme"

export const SPage = styled.div`
  --mobile-nav-height: calc(60px + env(safe-area-inset-bottom));
  --nav-height: 65px;
  --content-width: 1300px;

  position: relative;

  display: flex;
  flex-direction: column;

  min-height: 100vh;

  background: ${theme.colors.bg};

  @media ${theme.viewport.gte.sm} {
    --nav-height: 70px;

    overflow-y: auto;
  }

  @media ${theme.viewport.gte.md} {
    height: 100vh;
  }
`

export const SGradientBg = styled.div<{ flipped?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;

  height: 474px;
  background: ${theme.gradients.background};

  ${({ flipped }) =>
    flipped &&
    `
      position: fixed;
      rotate: 180deg;
      height: 237px;
      top: auto;
      bottom: 0;
      opacity: 0.4;
  `}
`

export const SPageContent = styled.main`
  position: relative;

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  ::-webkit-scrollbar {
    width: 0px;
  }

  ::-webkit-scrollbar-track {
    margin-top: var(--nav-height);
  }

  @media ${theme.viewport.gte.sm} {
    padding: 0 20px;

    display: block;

    ::-webkit-scrollbar {
      width: 6px;
    }
  }

  @media ${theme.viewport.gte.md} {
    padding-bottom: 0;

    display: block;
  }
`

export const SPageInner = styled.div`
  padding: 20px 12px;

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  position: relative;

  @media ${theme.viewport.gte.sm} {
    padding: 40px 20px;

    max-width: var(--content-width);
    margin: 0 auto;

    display: block;
  }
`

export const SSubHeader = styled.div`
  width: 100vw;

  position: relative;
  z-index: 1;

  overflow-x: auto;

  padding-bottom: 1px;

  ::after {
    content: "";

    z-index: -1;
    pointer-events: none;

    position: absolute;
    top: 0;
    bottom: 1px;
    left: 0;
    right: 0;

    background: rgba(9, 9, 9, 0.09);

    border-bottom: 0.5px solid rgba(249, 225, 225, 0.25);
    border-top: 0.5px solid rgba(249, 225, 225, 0.25);
  }

  @media (${theme.viewport.gte.sm}) {
    margin: 0 -26px;
  }
`
