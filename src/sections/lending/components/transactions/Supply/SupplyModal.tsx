import { PERMISSION } from "@aave/contract-helpers"

import React from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { SupplyModalContent } from "./SupplyModalContent"

export const SupplyModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
  }>

  return (
    <BasicModal open={type === ModalType.Supply} setOpen={close}>
      <ModalWrapper
        action="supply"
        title="Supply"
        underlyingAsset={args.underlyingAsset}
        requiredPermission={PERMISSION.DEPOSITOR}
      >
        {(params) => <SupplyModalContent {...params} />}
      </ModalWrapper>
    </BasicModal>
  )
}
