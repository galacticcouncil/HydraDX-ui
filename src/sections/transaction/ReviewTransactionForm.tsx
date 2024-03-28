import { TransactionResponse } from "@ethersproject/providers"
import { FC, useState } from "react"
import { SubmittableExtrinsic } from "@polkadot/api/types"
import { useMutation } from "@tanstack/react-query"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { useAccount, useWallet } from "sections/web3-connect/Web3Connect.utils"
import { MetaMaskSigner } from "sections/web3-connect/wallets/MetaMask/MetaMaskSigner"
import { Transaction, useStore } from "state/store"
import { theme } from "theme"
import { ReviewTransactionData } from "./ReviewTransactionData"
import {
  useEditFeePaymentAsset,
  usePolkadotJSTxUrl,
  useTransactionValues,
} from "./ReviewTransactionForm.utils"
import { ReviewTransactionSummary } from "sections/transaction/ReviewTransactionSummary"
import { HYDRADX_CHAIN_KEY } from "sections/xcm/XcmPage.utils"
import { useReferralCodesStore } from "sections/referrals/store/useReferralCodesStore"
import BN from "bignumber.js"
import {
  NATIVE_EVM_ASSET_ID,
  NATIVE_EVM_ASSET_SYMBOL,
  isEvmAccount,
} from "utils/evm"
import { isSetCurrencyExtrinsic } from "sections/transaction/ReviewTransaction.utils"

type TxProps = Omit<Transaction, "id" | "tx" | "xcall"> & {
  tx: SubmittableExtrinsic<"promise">
}

type Props = TxProps & {
  title?: string
  onCancel: () => void
  onEvmSigned: (data: {
    evmTx: TransactionResponse
    tx: SubmittableExtrinsic<"promise">
  }) => void
  onSigned: (signed: SubmittableExtrinsic<"promise">) => void
  onSignError?: (error: unknown) => void
}

export const ReviewTransactionForm: FC<Props> = (props) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { setReferralCode } = useReferralCodesStore()

  const polkadotJSUrl = usePolkadotJSTxUrl(props.tx)

  const shouldOpenPolkaJSUrl =
    polkadotJSUrl && account?.isExternalWalletConnected && !account?.delegate

  const { transactions } = useStore()

  const isChangingFeePaymentAsset =
    !isSetCurrencyExtrinsic(props.tx?.toHuman()) &&
    transactions?.some(({ tx }) => isSetCurrencyExtrinsic(tx?.toHuman()))

  const [tipAmount, setTipAmount] = useState<BN | undefined>(undefined)

  const transactionValues = useTransactionValues({
    xcallMeta: props.xcallMeta,
    tx: props.tx,
    overrides: props.overrides,
  })

  const {
    acceptedFeePaymentAssets,
    isEnoughPaymentBalance,
    feePaymentMeta,
    isLinkedAccount,
    storedReferralCode,
    tx,
  } = transactionValues.data

  const isLinking = !isLinkedAccount && storedReferralCode

  const {
    openEditFeePaymentAssetModal,
    editFeePaymentAssetModal,
    isOpenEditFeePaymentAssetModal,
  } = useEditFeePaymentAsset(acceptedFeePaymentAssets, feePaymentMeta?.id)

  const { wallet } = useWallet()

  const signTx = useMutation(
    async () => {
      try {
        const address = props.isProxy ? account?.delegate : account?.address

        if (!address) throw new Error("Missing active account")
        if (!wallet) throw new Error("Missing wallet")
        if (!wallet.signer) throw new Error("Missing signer")

        if (wallet?.signer instanceof MetaMaskSigner) {
          const evmTx = await wallet.signer.sendDispatch(tx.method.toHex())
          return props.onEvmSigned({ evmTx, tx })
        }

        const signature = await tx.signAsync(address, {
          tip: tipAmount?.gte(0) ? tipAmount.toString() : undefined,
          signer: wallet.signer,
          // defer to polkadot/api to handle nonce w/ regard to mempool
          nonce: -1,
        })

        return props.onSigned(signature)
      } catch (error) {
        props.onSignError?.(error)
      }
    },
    {
      onSuccess: () =>
        isLinking && account && setReferralCode(undefined, account.address),
    },
  )

  const isLoading =
    transactionValues.isLoading || signTx.isLoading || isChangingFeePaymentAsset
  const hasMultipleFeeAssets =
    props.xcallMeta && props.xcallMeta?.srcChain !== HYDRADX_CHAIN_KEY
      ? false
      : acceptedFeePaymentAssets.length > 1
  const isEditPaymentBalance = !isEnoughPaymentBalance && hasMultipleFeeAssets

  const isEvmFeePaymentAssetInvalid = isEvmAccount(account?.address)
    ? feePaymentMeta?.id !== NATIVE_EVM_ASSET_ID
    : false

  if (isOpenEditFeePaymentAssetModal) return editFeePaymentAssetModal

  const onConfirmClick = () =>
    shouldOpenPolkaJSUrl
      ? window.open(polkadotJSUrl, "_blank")
      : isEvmFeePaymentAssetInvalid
      ? openEditFeePaymentAssetModal()
      : isEnoughPaymentBalance
      ? signTx.mutate()
      : hasMultipleFeeAssets
      ? openEditFeePaymentAssetModal()
      : undefined

  let btnText = t("liquidity.reviewTransaction.modal.confirmButton")

  if (isEditPaymentBalance || isEvmFeePaymentAssetInvalid) {
    btnText = t(
      "liquidity.reviewTransaction.modal.confirmButton.notEnoughBalance",
    )
  } else if (signTx.isLoading) {
    btnText = t("liquidity.reviewTransaction.modal.confirmButton.loading")
  } else if (shouldOpenPolkaJSUrl) {
    btnText = t(
      "liquidity.reviewTransaction.modal.confirmButton.openPolkadotJS",
    )
  }

  const isTippingEnabled = props.xcallMeta
    ? props.xcallMeta?.srcChain === "hydradx" && !isEvmAccount(account?.address)
    : !isEvmAccount(account?.address)

  return (
    <>
      {props.title && (
        <Text color="basic400" fw={400} sx={{ mb: 16 }}>
          {props.title}
        </Text>
      )}
      <ModalScrollableContent
        sx={{
          mx: "calc(-1 * var(--modal-content-padding))",
          p: "var(--modal-content-padding)",
          maxHeight: 280,
        }}
        css={{ backgroundColor: `rgba(${theme.rgbColors.alpha0}, .06)` }}
        content={<ReviewTransactionData address={account?.address} tx={tx} />}
        footer={
          <div sx={{ mt: 15 }}>
            <ReviewTransactionSummary
              tx={props.tx}
              transactionValues={transactionValues}
              editFeePaymentAssetEnabled={
                hasMultipleFeeAssets || isEvmFeePaymentAssetInvalid
              }
              xcallMeta={props.xcallMeta}
              openEditFeePaymentAssetModal={openEditFeePaymentAssetModal}
              onTipChange={isTippingEnabled ? setTipAmount : undefined}
              referralCode={isLinking ? storedReferralCode : undefined}
            />
            <div
              sx={{
                mt: ["auto", 24],
                flex: "row",
                justify: "space-between",
                align: "start",
              }}
            >
              <Button
                onClick={props.onCancel}
                text={t("liquidity.reviewTransaction.modal.cancel")}
              />
              <div sx={{ flex: "column", justify: "center", gap: 4 }}>
                <Button
                  text={btnText}
                  variant="primary"
                  isLoading={isLoading}
                  disabled={
                    !account ||
                    isLoading ||
                    (!isEnoughPaymentBalance && !hasMultipleFeeAssets)
                  }
                  onClick={onConfirmClick}
                />
                {isEvmFeePaymentAssetInvalid && (
                  <Text fs={16} color="pink600">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.invalidEvmPaymentAsset.msg",
                      { symbol: NATIVE_EVM_ASSET_SYMBOL },
                    )}
                  </Text>
                )}
                {!isEnoughPaymentBalance && !transactionValues.isLoading && (
                  <Text fs={16} color="pink600">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.notEnoughBalance.msg",
                    )}
                  </Text>
                )}
                {signTx.isLoading && (
                  <Text fs={12} lh={16} tAlign="center" color="warning300">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.warning",
                    )}
                  </Text>
                )}
              </div>
            </div>
          </div>
        }
      />
    </>
  )
}
