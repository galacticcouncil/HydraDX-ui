import React from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { EmodeModalContent, EmodeModalType } from "./EmodeModalContent"

export const EmodeModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    emode: EmodeModalType
  }>
  return (
    <BasicModal open={type === ModalType.Emode} setOpen={close}>
      <EmodeModalContent mode={args.emode} />
    </BasicModal>
  )
}
