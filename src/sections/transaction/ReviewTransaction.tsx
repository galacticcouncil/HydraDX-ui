import { Modal } from "components/Modal/Modal"
import { Stepper } from "components/Stepper/Stepper"
import { ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { Transaction } from "state/store"
import { useSendTx } from "./ReviewTransaction.utils"
import { ReviewTransactionError } from "./ReviewTransactionError"
import { ReviewTransactionForm } from "./ReviewTransactionForm"
import { ReviewTransactionPending } from "./ReviewTransactionPending"
import { ReviewTransactionSuccess } from "./ReviewTransactionSuccess"
import { ReviewTransactionToast } from "./ReviewTransactionToast"
import { ReviewTransactionXCallForm } from "./ReviewTransactionXCallForm"
import { WalletUpgradeModal } from "sections/web3-connect/upgrade/WalletUpgradeModal"
import { isEvmXCall } from "sections/transaction/ReviewTransactionXCallForm.utils"
import { ReviewTransactionEvmTxForm } from "sections/transaction/ReviewTransactionEvmTxForm"

export const ReviewTransaction = (props: Transaction) => {
  const { t } = useTranslation()
  const [minimizeModal, setMinimizeModal] = useState(false)

  const {
    sendTx,
    sendEvmTx,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    txState,
    reset,
  } = useSendTx()

  const modalProps: Partial<ComponentProps<typeof Modal>> =
    isLoading || isSuccess || isError
      ? {
          title: undefined,
          backdrop: isError ? "error" : "default",
          disableClose: isLoading,
        }
      : {
          title: t("liquidity.reviewTransaction.modal.title"),
          description: t("liquidity.reviewTransaction.modal.desc"),
        }

  const handleTxOnClose = () => {
    if (isLoading) {
      setMinimizeModal(true)
      return
    }

    if (isSuccess) {
      props.onSuccess?.(data)
    } else {
      props.onError?.()
    }
  }

  const onClose = () => {
    handleTxOnClose()
    props.onClose?.()
  }

  const onBack = props.onBack
    ? () => {
        handleTxOnClose()
        props.onBack?.()
      }
    : undefined

  const onReview = () => {
    reset()
    setMinimizeModal(false)
  }

  return (
    <>
      {minimizeModal && (
        <ReviewTransactionToast
          id={props.id}
          isLoading={isLoading}
          isSuccess={isSuccess}
          isError={isError}
          error={error}
          link={data?.transactionLink}
          onReview={onReview}
          onClose={onClose}
          toastMessage={props.toastMessage}
        />
      )}

      <Modal
        open={!minimizeModal}
        onBack={onBack}
        onClose={onClose}
        disableCloseOutside
        topContent={props.steps ? <Stepper steps={props.steps} /> : undefined}
        {...modalProps}
      >
        {isLoading ? (
          <ReviewTransactionPending txState={txState} onClose={onClose} />
        ) : isSuccess ? (
          <ReviewTransactionSuccess onClose={onClose} />
        ) : isError ? (
          <ReviewTransactionError onClose={onClose} onReview={onReview} />
        ) : props.tx ? (
          <ReviewTransactionForm
            tx={props.tx}
            xcallMeta={props.xcallMeta}
            isProxy={props.isProxy}
            overrides={props.overrides}
            title={props.title}
            onCancel={onClose}
            onEvmSigned={(data) => {
              props.onSubmitted?.()
              sendEvmTx(data)
            }}
            onSigned={(signed) => {
              props.onSubmitted?.()
              sendTx(signed)
            }}
          />
        ) : props.evmTx ? (
          <ReviewTransactionEvmTxForm
            tx={props.evmTx}
            onCancel={onClose}
            onEvmSigned={(data) => {
              props.onSubmitted?.()
              sendEvmTx(data)
            }}
          />
        ) : isEvmXCall(props.xcall) && props.xcallMeta ? (
          <ReviewTransactionXCallForm
            xcall={props.xcall}
            xcallMeta={props.xcallMeta}
            title={props.title}
            onCancel={onClose}
            onEvmSigned={(data) => {
              props.onSubmitted?.()
              sendEvmTx(data)
            }}
          />
        ) : null}
      </Modal>
      <WalletUpgradeModal />
    </>
  )
}
