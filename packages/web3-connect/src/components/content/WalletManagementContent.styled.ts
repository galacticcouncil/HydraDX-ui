import {
  Box,
  Button,
  Flex,
  Grid,
  Input,
  ModalBody,
  ModalHeader,
  Text,
} from "@galacticcouncil/ui/components"
import { mq } from "@galacticcouncil/ui/theme"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

type PanelProps = { showAccountPanel: boolean }

const shouldForwardProp = (prop: string) => prop !== "showAccountPanel"

export const SScrollAreaContent = styled(Box)(
  ({ theme }) => css`
    min-width: 0;
    padding-right: calc(${theme.space.xs} + ${pxToRem(6)});
  `,
)

export const SWalletManagementShell = styled(Box, {
  shouldForwardProp,
})<PanelProps>(
  ({ showAccountPanel }) => css`
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;

    display: flex;
    flex-direction: column;
    overflow: hidden;

    transition: width 180ms ease;

    ${mq("md")} {
      width: ${showAccountPanel ? pxToRem(650) : pxToRem(452)};
      height: ${showAccountPanel ? "min(720px, 80vh)" : "80vh"};
      max-height: 80vh;
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

export const SSearchInput = styled(Input)(
  () => css`
    flex-shrink: 0;
    width: 100%;
  `,
)

export const SSourceColumn = styled(Flex, { shouldForwardProp })<PanelProps>(
  ({ theme }) => css`
    flex-direction: column;
    gap: ${theme.space.base};

    min-width: 0;
    min-height: 0;
    max-height: none;
    overflow: hidden;
    padding-inline: 0;

    ${mq("md")} {
      max-height: 100%;
    }
  `,
)

export const SSourceSectionLabel = styled(Text)`
  line-height: ${pxToRem(15)};
`

export const SSourceOtherSectionLabel = styled(Text, {
  shouldForwardProp,
})<PanelProps>(
  ({ theme, showAccountPanel }) => css`
    line-height: ${pxToRem(15)};
    padding-top: ${showAccountPanel ? 0 : theme.space.l};
  `,
)

export const SSourceScrollFrame = styled(Box)`
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`

export const SSourceList = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    gap: ${theme.space.s};
  `,
)

export const SRightPanelFrame = styled(Box, {
  shouldForwardProp,
})<PanelProps>(
  ({ showAccountPanel }) => css`
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

export const SRightColumnBody = styled(Box)(
  () => css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  `,
)

export const SAccountFilterButton = styled(Button)(
  ({ theme }) => css`
    min-width: ${pxToRem(80)};
    padding-block: ${theme.space.s};
  `,
)

export const SAccountScrollFrame = styled(Box)`
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`

export const SMoreWalletsDropdown = styled(Box)(
  ({ theme }) => css`
    border-radius: ${theme.radii.m};
    overflow: hidden;
  `,
)

export const SMoreWalletsList = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    padding-top: ${theme.space.xs};
  `,
)

export const SEmptyState = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    justify-content: center;
    min-height: ${pxToRem(260)};
    border-radius: ${theme.radii.m};
    background: ${theme.surfaces.containers.dim.dimOnBg};
  `,
)
