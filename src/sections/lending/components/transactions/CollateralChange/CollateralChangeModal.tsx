import React from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { CollateralChangeModalContent } from "./CollateralChangeModalContent"

export const CollateralChangeModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
  }>
  return (
    <BasicModal open={type === ModalType.CollateralChange} setOpen={close}>
      <ModalWrapper title="Review tx" underlyingAsset={args.underlyingAsset}>
        {(params) => <CollateralChangeModalContent {...params} />}
      </ModalWrapper>
    </BasicModal>
  )
}
