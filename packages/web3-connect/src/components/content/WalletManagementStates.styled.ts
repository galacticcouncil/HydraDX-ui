import {
  Box,
  Flex,
  Image,
  LoadingButton,
  Spinner,
} from "@galacticcouncil/ui/components"
import { mq } from "@galacticcouncil/ui/theme"
import { css, pxToRem, styled } from "@galacticcouncil/ui/utils"

export const SChainSelectHeader = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};

    padding: ${theme.space.base} ${theme.space.base} ${theme.space.s};

    ${mq("md")} {
      padding: ${theme.space.xl} ${theme.space.xxxl} ${theme.space.s};
    }
  `,
)

export const SWalletMark = styled(Image)(
  ({ theme }) => css`
    width: calc(${theme.sizes["2xl"]} + ${theme.space.l});
    height: calc(${theme.sizes["2xl"]} + ${theme.space.l});
    border-radius: ${theme.radii.full};
    flex-shrink: 0;
    object-fit: contain;
  `,
)

export const SWalletConnectionState = styled(Flex)(
  ({ theme }) => css`
    align-items: center;
    justify-content: center;

    border-radius: ${theme.radii.m};
    background: ${theme.surfaces.containers.dim.dimOnBg};

    min-height: ${theme.sizes["4xl"]};
    height: 100%;
    padding: ${theme.space.xl};

    ${mq("md")} {
      padding: ${theme.space.xxxl};
    }
  `,
)

export const SWalletConnectionBody = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};
    max-width: ${pxToRem(340)};
    width: 100%;
  `,
)

export const SWalletConnectionVisual = styled(Box)(
  ({ theme }) => css`
    width: calc(${theme.sizes["2xl"]} + ${theme.space.l});
    height: calc(${theme.sizes["2xl"]} + ${theme.space.l});

    display: grid;
    place-items: center;

    > * {
      grid-column: 1;
      grid-row: 1;
    }
  `,
)

export const SWalletConnectionSpinner = styled(Spinner)`
  width: 100%;
  height: 100%;
`

export const SWalletConnectionStatusIcon = styled(Box)(
  ({ theme }) => css`
    width: calc(${theme.sizes["2xl"]} - ${theme.space.base});
    height: calc(${theme.sizes["2xl"]} - ${theme.space.base});
    border-radius: ${theme.radii.full};

    background: ${theme.accents.danger.dimBg};
    color: ${theme.accents.danger.secondary};

    display: flex;
    align-items: center;
    justify-content: center;
  `,
)

export const SWalletConnectionErrorRing = styled(Box)(
  ({ theme }) => css`
    width: 100%;
    height: 100%;
    border: ${theme.sizes["3xs"]} solid ${theme.accents.danger.secondary};
    border-radius: ${theme.radii.full};
  `,
)

export const SWalletConnectionLogo = styled(Image)(
  ({ theme }) => css`
    width: ${theme.sizes["2xl"]};
    height: ${theme.sizes["2xl"]};
    border-radius: ${theme.radii.full};
    flex-shrink: 0;
    object-fit: contain;

    &[data-framed="true"] {
      width: calc(${theme.sizes["2xl"]} - ${theme.space.base});
      height: calc(${theme.sizes["2xl"]} - ${theme.space.base});
    }
  `,
)

export const SCenteredTextGroup = styled(Flex)(
  ({ theme }) => css`
    flex-direction: column;
    align-items: center;
    gap: ${theme.space.base};
  `,
)

export const SWalletConnectionAction = styled(LoadingButton)(
  ({ theme }) => css`
    margin-top: ${theme.space.s};
    gap: ${theme.space.xs};
  `,
)
