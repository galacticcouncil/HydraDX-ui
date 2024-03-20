import { InterestRate, PERMISSION } from "@aave/contract-helpers"

import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { RepayModalContent } from "./RepayModalContent"

export const RepayModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
    currentRateMode: InterestRate
    isFrozen: boolean
  }>

  return (
    <BasicModal open={type === ModalType.Repay} setOpen={close}>
      <ModalWrapper
        title="Repay"
        underlyingAsset={args.underlyingAsset}
        requiredPermission={PERMISSION.BORROWER}
      >
        {(params) => {
          return (
            <RepayModalContent {...params} debtType={args.currentRateMode} />
          )
        }}
      </ModalWrapper>
    </BasicModal>
  )
}
