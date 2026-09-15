import {
  Box,
  Button,
  Flex,
  Grid,
  ModalBody,
  ModalHeader,
} from "@galacticcouncil/ui/components"
import { mq } from "@galacticcouncil/ui/theme"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

type PanelProps = { showAccountPanel: boolean }

type MobileColumnProps = { mobileHidden: boolean }

const shouldForwardProp = (prop: string) => prop !== "showAccountPanel"

const shouldForwardColumnProp = (prop: string) =>
  prop !== "showAccountPanel" && prop !== "mobileHidden"

export const SScrollAreaContent = styled(Box)(
  ({ theme }) => css`
    min-width: 0;
    padding-right: calc(${theme.space.xs} + ${pxToRem(6)});
    padding-bottom: var(--source-footer-height, 0px);
  `,
)

export const SWalletManagementShell = styled(Box, {
  shouldForwardProp,
})<PanelProps>(
  ({ showAccountPanel }) => css`
    width: 100%;
    max-width: 100%;
    max-height: 75dvh;

    display: flex;
    flex-direction: column;
    overflow: hidden;

    transition: width 180ms ease;

    ${mq("max-xs")} {
      height: 100dvh;
      max-height: 100dvh;
    }

    ${mq("md")} {
      width: ${showAccountPanel ? pxToRem(650) : pxToRem(452)};
    }
  `,
)

export const SModalHeader = styled(ModalHeader, {
  shouldForwardProp,
})<PanelProps>(
  ({ theme, showAccountPanel }) => css`
    padding-bottom: ${showAccountPanel ? theme.space.base : theme.space.l};
    flex-shrink: 0;
  `,
)

export const SModalBody = styled(ModalBody)(
  ({ theme }) => css`
    padding: 0 ${theme.space.base} ${theme.space.base};
    border-top: 0;

    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    ${mq("md")} {
      padding: 0 ${theme.space.s} ${theme.space.m} ${theme.space.m};
    }
  `,
)

export const SLayoutGrid = styled(Grid, { shouldForwardProp })<PanelProps>(
  ({ theme, showAccountPanel }) => css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${theme.space.base};

    width: 100%;
    max-width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    transition:
      grid-template-columns 180ms ease,
      gap 180ms ease;

    ${mq("md")} {
      grid-template-columns: ${showAccountPanel
        ? `${pxToRem(200)} minmax(0, 1fr)`
        : "minmax(0, 1fr) minmax(0, 0fr)"};
      gap: ${showAccountPanel ? theme.space.s : 0};
    }
  `,
)

export const SSourceColumn = styled(Flex, {
  shouldForwardProp: shouldForwardColumnProp,
})<MobileColumnProps>(
  ({ theme, mobileHidden }) => css`
    flex-direction: column;
    gap: ${theme.space.base};

    min-width: 0;
    min-height: 0;
    max-height: none;
    overflow: hidden;
    padding-inline: 0;

    ${mq("max-sm")} {
      display: ${mobileHidden ? "none" : "flex"};
    }

    ${mq("md")} {
      max-height: 100%;
    }
  `,
)

const SOURCE_FOOTER_PAD = pxToRem(4)
const SOURCE_FOOTER_BUTTON_HEIGHT = pxToRem(40)

export const SSourceScrollFrame = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasFooter",
})<{ hasFooter?: boolean }>(
  ({ hasFooter }) => css`
    position: relative;

    flex: 1;
    min-height: 0;
    height: 100%;
    overflow: hidden;

    --source-footer-height: ${hasFooter
      ? `calc(${SOURCE_FOOTER_PAD} + ${SOURCE_FOOTER_BUTTON_HEIGHT})`
      : "0px"};
  `,
)

export const SSourceFooter = styled(Box)(
  ({ theme }) => css`
    position: absolute;
    left: 0;
    bottom: 0;
    right: ${theme.space.base};
    z-index: 2;

    display: flex;
    flex-direction: column;
    padding-top: ${SOURCE_FOOTER_PAD};

    background: ${theme.surfaces.themeBasePalette.surfaceHigh};
  `,
)

export const SSourceFooterAction = styled(Box)`
  min-height: ${SOURCE_FOOTER_BUTTON_HEIGHT};
`

export const SRightPanelFrame = styled(Box, {
  shouldForwardProp: shouldForwardColumnProp,
})<PanelProps & MobileColumnProps>(
  ({ showAccountPanel, mobileHidden }) => css`
    min-width: 0;
    min-height: 0;
    max-height: ${showAccountPanel ? "none" : 0};
    overflow: hidden;

    opacity: ${showAccountPanel ? 1 : 0};
    visibility: ${showAccountPanel ? "visible" : "hidden"};
    pointer-events: ${showAccountPanel ? "auto" : "none"};
    transition: ${showAccountPanel
      ? "opacity 120ms ease 120ms"
      : "opacity 80ms ease, visibility 0s linear 80ms"};

    ${mq("max-sm")} {
      display: ${mobileHidden ? "none" : "flex"};
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    ${mq("md")} {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 100%;
    }
  `,
)

export const SRightColumn = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    gap: ${theme.space.base};

    min-width: 0;
    min-height: 0;
    flex: 1;
    max-height: none;
    overflow: hidden;

    ${mq("md")} {
      max-height: 100%;
    }
  `,
)

export const SAccountFilterButton = styled(Button)(
  ({ theme }) => css`
    min-width: ${pxToRem(80)};
    padding-block: ${theme.space.s};
  `,
)
