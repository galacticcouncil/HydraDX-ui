import { Box, Button, Flex, Image } from "@galacticcouncil/ui/components"
import { mq } from "@galacticcouncil/ui/theme"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

/** Styles for the three states the right panel shows instead of accounts. */
export const SChainSelectHeader = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};

    padding: ${theme.space.base} ${theme.space.base} ${theme.space.s};

    ${mq("md")} {
      padding: ${theme.space.xl} ${pxToRem(30)} ${theme.space.s};
    }
  `,
)

/** The large mark in the connect and chain-select states. */
export const SWalletMark = styled(Image)`
  width: ${pxToRem(52)};
  height: ${pxToRem(52)};
  border-radius: 9999px;
  flex-shrink: 0;
  object-fit: contain;
`

export const SWalletErrorState = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    justify-content: center;

    border-radius: ${theme.radii.m};
    background: ${theme.surfaces.containers.dim.dimOnBg};

    min-height: ${pxToRem(260)};
    height: 100%;
    padding: ${theme.space.xl};

    ${mq("md")} {
      padding: ${pxToRem(30)};
    }
  `,
)

export const SWalletErrorBody = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};
    max-width: ${pxToRem(340)};
  `,
)

export const SWalletErrorIcon = styled(Box)(
  ({ theme }) => css`
    width: ${pxToRem(40)};
    height: ${pxToRem(40)};
    border-radius: ${theme.radii.full};

    background: ${theme.accents.danger.dimBg};
    color: ${theme.accents.danger.secondary};

    display: flex;
    align-items: center;
    justify-content: center;
  `,
)

export const SCenteredTextGroup = styled(Flex)`
  flex-direction: column;
  align-items: center;
  gap: ${pxToRem(6)};
`

export const SWalletErrorRetryButton = styled(Button)(
  ({ theme }) => css`
    margin-top: ${theme.space.s};
  `,
)

export const SWalletConnectState = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
    min-height: ${pxToRem(260)};
    padding: ${theme.space.xl} ${theme.space.base};

    ${mq("md")} {
      padding: ${pxToRem(46)} ${pxToRem(30)};
    }
  `,
)

export const SWalletConnectBody = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};
    width: 100%;
  `,
)

export const SWalletConnectButton = styled(Button)(
  ({ theme }) => css`
    margin-top: ${theme.space.s};
    gap: ${theme.space.xs};
    color: ${theme.buttons.primary.medium.onButton};
  `,
)
