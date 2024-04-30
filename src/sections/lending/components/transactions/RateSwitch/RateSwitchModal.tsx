import { InterestRate } from "@aave/contract-helpers"

import React from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { RateSwitchModalContent } from "./RateSwitchModalContent"

export const RateSwitchModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
    currentRateMode: InterestRate
  }>

  return (
    <BasicModal open={type === ModalType.RateSwitch} setOpen={close}>
      <ModalWrapper
        hideTitleSymbol
        title="Switch APY type"
        underlyingAsset={args.underlyingAsset}
      >
        {(params) => (
          <RateSwitchModalContent
            {...params}
            currentRateMode={args.currentRateMode}
          />
        )}
      </ModalWrapper>
    </BasicModal>
  )
}
