import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "theme"

export const SPage = styled.div`
  --mobile-nav-height: calc(60px + env(safe-area-inset-bottom));
  --nav-height: 65px;
  --content-width: 1109px;

  position: relative;

  display: flex;
  flex-direction: column;

  height: 100vh;

  background: ${theme.colors.bg};

  @media ${theme.viewport.gte.sm} {
    --nav-height: 70px;

    overflow-y: overlay;
  }
`

export const SGradientBg = styled.div<{ variant?: "stats" | "default" }>`
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;

  overflow: overlay;

  ${({ variant }) =>
    variant === "stats"
      ? css`
          height: 1360px;
          background: ${theme.gradients.backgroundStats};
        `
      : css`
          height: 474px;
          background: ${theme.gradients.background};
        `}
`

export const SPageContent = styled.main`
  position: relative;

  overflow-y: auto;
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  padding-top: var(--nav-height);
  padding-bottom: var(--mobile-nav-height);

  ::-webkit-scrollbar {
    width: 0px;
  }

  ::-webkit-scrollbar-track {
    margin-top: var(--nav-height);
  }

  @media ${theme.viewport.gte.sm} {
    padding-top: var(--nav-height);
    padding-bottom: var(--mobile-nav-height);

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
  padding: 16px 12px;

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  position: relative;
  z-index: 2;

  @media ${theme.viewport.gte.sm} {
    padding: 44px 20px;

    max-width: var(--content-width);
    margin: 0 auto;

    display: block;
  }
`

export const SPageGrid = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;

  opacity: 0.06;
  pointer-events: none;

  background-size: 22px 22px;
  background-image: linear-gradient(to right, white 1px, transparent 1px),
    linear-gradient(to bottom, white 1px, transparent 1px);
  mask-image: linear-gradient(180deg, #d9d9d9 0%, rgba(217, 217, 217, 0) 100%);
`

export const SSubHeader = styled.div`
  border-bottom: solid 1px rgba(114, 131, 165, 0.6);

  padding: 12px;

  & > div {
    @media ${theme.viewport.gte.sm} {
      max-width: var(--content-width);
      margin: 0 auto;

      display: block;
    }
  }
`
