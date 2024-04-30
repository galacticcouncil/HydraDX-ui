import { PERMISSION } from "@aave/contract-helpers"
import React, { useState } from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { useRootStore } from "sections/lending/store/root"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { BorrowModalContent } from "./BorrowModalContent"
import { GhoBorrowModalContent } from "./GhoBorrowModalContent"

export const BorrowModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
  }>
  const { currentMarket } = useProtocolDataContext()

  const [borrowUnWrapped, setBorrowUnWrapped] = useState(true)
  const [displayGho] = useRootStore((store) => [store.displayGho])

  const handleBorrowUnwrapped = (borrowUnWrapped: boolean) => {
    setBorrowUnWrapped(borrowUnWrapped)
  }

  return (
    <BasicModal open={type === ModalType.Borrow} setOpen={close}>
      <ModalWrapper
        action="borrow"
        title="Borrow"
        underlyingAsset={args.underlyingAsset}
        keepWrappedSymbol={!borrowUnWrapped}
        requiredPermission={PERMISSION.BORROWER}
      >
        {(params) =>
          displayGho({ symbol: params.symbol, currentMarket }) ? (
            <GhoBorrowModalContent {...params} />
          ) : (
            <BorrowModalContent
              {...params}
              unwrap={borrowUnWrapped}
              setUnwrap={handleBorrowUnwrapped}
            />
          )
        }
      </ModalWrapper>
    </BasicModal>
  )
}
