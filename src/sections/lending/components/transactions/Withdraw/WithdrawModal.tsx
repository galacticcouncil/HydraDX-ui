import { PERMISSION } from "@aave/contract-helpers"

import { useState } from "react"
import {
  ModalContextType,
  ModalType,
  useModalContext,
} from "sections/lending/hooks/useModal"

import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { ModalWrapper } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { WithdrawModalContent } from "./WithdrawModalContent"

export const WithdrawModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string
  }>
  const [withdrawUnWrapped, setWithdrawUnWrapped] = useState(true)

  return (
    <BasicModal open={type === ModalType.Withdraw} setOpen={close}>
      <ModalWrapper
        title="Withdraw"
        underlyingAsset={args.underlyingAsset}
        keepWrappedSymbol={!withdrawUnWrapped}
        requiredPermission={PERMISSION.DEPOSITOR}
      >
        {(params) => (
          <WithdrawModalContent
            {...params}
            unwrap={withdrawUnWrapped}
            setUnwrap={setWithdrawUnWrapped}
          />
        )}
      </ModalWrapper>
    </BasicModal>
  )
}
