import isPropValid from "@emotion/is-prop-valid"
import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { Content, Overlay } from "@radix-ui/react-dialog"

import { Box } from "@/components/Box"
import { ButtonIcon } from "@/components/Button"
import { Flex } from "@/components/Flex"
import { Paper } from "@/components/Paper"
import { Separator } from "@/components/Separator"
import { Text } from "@/components/Text"
import { mq } from "@/theme"

const DEFAULT_ANIMATION_DURATION = 200

const shouldForwardProp = (prop: string) =>
  isPropValid(prop) &&
  prop !== "animationDurationMs" &&
  prop !== "contentWidth" &&
  prop !== "hasTopContent" &&
  prop !== "noPadding" &&
  prop !== "isBlurred"

export const SModalOverlay = styled(Overlay, {
  shouldForwardProp,
})<{ animationDurationMs?: number; isBlurred?: boolean }>(
  ({
    theme,
    animationDurationMs = DEFAULT_ANIMATION_DURATION,
    isBlurred = false,
  }) => css`
    position: fixed;
    inset: 0;

    display: grid;
    place-items: center;

    z-index: ${theme.zIndices.modal};

    background: ${isBlurred
      ? theme.details.overlayHigh
      : theme.details.overlays};
    backdrop-filter: ${isBlurred ? "blur(2px)" : "none"};

    &[data-state="open"] {
      animation: ${theme.animations.fadeIn};
      animation-duration: ${animationDurationMs}ms;
    }

    &[data-state="closed"] {
      animation: ${theme.animations.fadeOut};
      animation-duration: ${animationDurationMs}ms;
    }
  `,
)

export const SModalWrapper = styled(Overlay, { shouldForwardProp })<{
  animationDurationMs?: number
}>`
  --modal-block-offset: 10vh;
  --modal-animation-duration: ${({
    animationDurationMs = DEFAULT_ANIMATION_DURATION,
  }) => animationDurationMs}ms;

  position: fixed;
  inset: 0;
  padding-block: var(--modal-block-offset);

  display: grid;
  gap: ${({ theme }) => theme.space.s};
  justify-items: center;

  overflow-y: auto;

  z-index: ${({ theme }) => theme.zIndices.modal};

  &[data-state="closed"] {
    animation: ${({ theme }) => theme.animations.fadeOut}
      var(--modal-animation-duration);
  }
`

export const SModalContent = styled(Content, {
  shouldForwardProp,
})<{
  contentWidth?: string
  hasTopContent?: boolean
}>(
  ({ theme, contentWidth, hasTopContent }) => css`
    --modal-content-padding: ${theme.space.xl};
    --modal-content-inset: calc(var(--modal-content-padding) * -1);
    --modal-content-width: ${contentWidth ?? theme.sizes["6xl"]};
    --modal-top-content-height: ${hasTopContent ? theme.sizes["2xl"] : "0px"};

    position: fixed;
    inset: 0;
    outline: none;

    width: 100%;
    height: 100dvh;

    & > div > :not([hidden]) ~ :not([hidden]) {
      border-top: 1px solid ${theme.details.separators};
    }

    &[data-state="open"] {
      animation: ${theme.animations.fadeInBottom};
      animation-timing-function: ${theme.easings.outExpo};
      animation-duration: var(--modal-animation-duration);
    }

    &[data-state="closed"] {
      animation: ${theme.animations.fadeOutBottom};
      animation-duration: var(--modal-animation-duration);
    }

    ${mq("sm")} {
      position: relative;
      inset: auto;

      width: min(var(--modal-content-width), calc(100vw - 32px));
      max-width: min(var(--modal-content-width), calc(100vw - 32px));
      height: auto;

      &[data-state="open"] {
        animation: ${theme.animations.scaleInTop};
        animation-duration: var(--modal-animation-duration);
      }

      &[data-state="closed"] {
        animation: ${theme.animations.scaleOutTop};
        animation-duration: var(--modal-animation-duration);
      }
    }
  `,
)

export const SModalPaper = styled(Paper)`
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 100%;
  padding-bottom: env(safe-area-inset-bottom);

  ${mq("max-xs")} {
    height: calc(100% - var(--modal-top-content-height));
    border: 0;
    border-radius: 0;
    overflow-y: auto;
  }
`

export const SModalHeader = styled(Flex)`
  flex-direction: column;

  padding: var(--modal-content-padding);
  --modal-header-button-size: 2.215rem;

  & > div:first-of-type {
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.space.base};

    & > :not(button) {
      flex-grow: 1;
    }
  }
`

export const SModalHeaderButton = styled(ButtonIcon)<{
  align?: "left" | "right"
}>`
  flex-grow: 0;

  width: var(--modal-header-button-size);
  height: var(--modal-header-button-size);

  cursor: pointer;

  position: absolute;
  top: 0;
  ${({ align }) => `${align}: 0`};
`

export const SModalTitleContainer = styled(Flex)`
  position: relative;
  min-height: var(--modal-header-button-size);
`

export const SModalBody = styled(Box, { shouldForwardProp })<{
  noPadding?: boolean
}>`
  padding: ${({ noPadding }) =>
    noPadding ? 0 : "var(--modal-content-padding)"};

  flex: 1;

  &:last-of-type {
    border-bottom-right-radius: ${({ theme }) => theme.radii.xl};
    border-bottom-left-radius: ${({ theme }) => theme.radii.xl};
  }
`

export const SModalFooter = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column-reverse;
    gap: ${theme.space.base};

    padding: ${theme.space.xl};

    &:last-of-type {
      border-bottom-right-radius: ${theme.radii.xl};
      border-bottom-left-radius: ${theme.radii.xl};
    }

    ${mq("md")} {
      flex-direction: row;
    }
  `,
)

export const SModalTitle = styled(Text)`
  color: ${({ theme }) => theme.text.high};
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.h7};
  font-family: ${({ theme }) => theme.fontFamilies1.primary};
`

export const SModalDescription = styled(Text)`
  color: ${({ theme }) => theme.text.medium};
  font-size: ${({ theme }) => theme.fontSizes.p5};
`

export const SModalContentDivider = styled(Separator)`
  margin-inline: var(--modal-content-inset);
`

export const SModalTopContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;

  padding-inline: var(--modal-content-padding);
  height: var(--modal-top-content-height);

  ${mq("max-xs")} {
    border-bottom: 1px solid ${({ theme }) => theme.details.separators};
    background-color: ${({ theme }) =>
      theme.surfaces.themeBasePalette.surfaceHigh};
  }
`
