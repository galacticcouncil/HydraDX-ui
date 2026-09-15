import styled from "@emotion/styled"
import { Flex } from "@galacticcouncil/ui/components"
import { createVariants, css } from "@galacticcouncil/ui/utils"

import { StepTriggerState } from "@/components/multisig/components/StepTrigger"

const stepIndicatorVariants = createVariants<StepTriggerState>((theme) => ({
  active: css`
    background-color: ${theme.buttons.primary.medium.rest};
    border-color: ${theme.buttons.primary.medium.rest};
  `,
  done: css`
    background-color: ${theme.details.separators};
    border-color: transparent;
  `,
  todo: css`
    background-color: transparent;
    border-color: ${theme.buttons.primary.medium.rest};
  `,
}))

export const SStepIndicator = styled(Flex, {
  shouldForwardProp: (prop) => prop !== "state",
})<{ state: StepTriggerState }>(({ theme, state }) => [
  css`
    align-items: center;
    justify-content: center;
    width: ${theme.space.xl};
    height: ${theme.space.xl};
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid transparent;
  `,
  stepIndicatorVariants(state),
])

export const SStepTrigger = styled.button<{ isInteractive?: boolean }>(
  ({ theme, isInteractive = false }) => [
    css`
      position: relative;
      display: flex;
      align-items: center;
      gap: ${theme.space.m};
      width: 100%;
      padding-block: ${theme.space.l};
      padding-inline: ${theme.space.s};

      & > * {
        position: relative;
      }

      &::before {
        content: "";
        position: absolute;
        inset: ${theme.space.s};
        border-radius: ${theme.radii.l};
        background-color: ${theme.details.separators};
        opacity: 0;
        transition: ${theme.transitions.opacity};
      }
    `,
    isInteractive &&
      css`
        &:hover {
          cursor: pointer;
          &::before {
            opacity: 1;
          }
        }
      `,
  ],
)
