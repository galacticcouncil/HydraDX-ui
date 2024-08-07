import { TransactionResponse } from "@ethersproject/providers"
import { FC, useState } from "react"
import { SubmittableExtrinsic } from "@polkadot/api/types"
import { useMutation } from "@tanstack/react-query"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import {
  useAccount,
  useEvmWalletReadiness,
  useWallet,
} from "sections/web3-connect/Web3Connect.utils"
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
import { H160, isEvmAccount } from "utils/evm"
import { isSetCurrencyExtrinsic } from "sections/transaction/ReviewTransaction.utils"
import {
  EthereumSigner,
  PermitResult,
} from "sections/web3-connect/signer/EthereumSigner"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { isAnyParachain } from "utils/helpers"
import { EVM_PROVIDERS } from "sections/web3-connect/constants/providers"
import {
  useWeb3ConnectStore,
  WalletMode,
} from "sections/web3-connect/store/useWeb3ConnectStore"

type TxProps = Omit<Transaction, "id" | "tx" | "xcall"> & {
  tx: SubmittableExtrinsic<"promise">
}

type Props = TxProps & {
  title?: string
  onCancel: () => void
  onPermitDispatched: ({
    permit,
    xcallMeta,
  }: {
    permit: PermitResult
    xcallMeta?: Record<string, string>
  }) => void
  onEvmSigned: (data: {
    evmTx: TransactionResponse
    tx: SubmittableExtrinsic<"promise">
    xcallMeta?: Record<string, string>
  }) => void
  onSigned: (
    signed: SubmittableExtrinsic<"promise">,
    xcallMeta?: Record<string, string>,
  ) => void
  onSignError?: (error: unknown) => void
}

export const ReviewTransactionForm: FC<Props> = (props) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { setReferralCode } = useReferralCodesStore()
  const { toggle: toggleWeb3Modal } = useWeb3ConnectStore()

  const polkadotJSUrl = usePolkadotJSTxUrl(props.tx)

  const shouldOpenPolkaJSUrl =
    polkadotJSUrl && account?.isExternalWalletConnected && !account?.delegate

  const { transactions } = useStore()

  const isChangingFeePaymentAsset =
    !isSetCurrencyExtrinsic(props.tx?.toHuman()) &&
    transactions?.some(({ tx }) => isSetCurrencyExtrinsic(tx?.toHuman()))

  const [tipAmount, setTipAmount] = useState<BN | undefined>(undefined)
  const [customNonce, setCustomNonce] = useState<string | undefined>(undefined)

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
    era,
    shouldUsePermit,
    permitNonce,
    pendingPermit,
  } = transactionValues.data

  const isPermitTxPending = !!pendingPermit

  const isIncompatibleWalletProvider =
    !props.xcallMeta &&
    account &&
    isEvmAccount(account.address) &&
    !EVM_PROVIDERS.includes(account.provider)

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

        if (wallet?.signer instanceof EthereumSigner) {
          const txData = tx.method.toHex()

          if (shouldUsePermit) {
            const nonce = customNonce ? BN(customNonce) : permitNonce
            const permit = await wallet.signer.getPermit(txData, nonce)
            return props.onPermitDispatched({
              permit,
              xcallMeta: props.xcallMeta,
            })
          }

          const evmTx = await wallet.signer.sendDispatch(txData)
          return props.onEvmSigned({ evmTx, tx, xcallMeta: props.xcallMeta })
        }

        const srcChain = props?.xcallMeta?.srcChain
          ? chainsMap.get(props.xcallMeta.srcChain)
          : null

        const isH160SrcChain =
          !!srcChain && isAnyParachain(srcChain) && srcChain.h160AccOnly

        const formattedAddress = isH160SrcChain
          ? H160.fromAccount(address)
          : address

        const signature = await tx.signAsync(formattedAddress, {
          era: era?.period?.toNumber(),
          tip: tipAmount?.gte(0) ? tipAmount.toString() : undefined,
          signer: wallet.signer,
          // defer to polkadot/api to handle nonce w/ regard to mempool
          nonce: customNonce ? parseInt(customNonce) : -1,
          withSignedTransaction: true,
        })

        return props.onSigned(signature, props.xcallMeta)
      } catch (error) {
        props.onSignError?.(error)
      }
    },
    {
      onSuccess: () =>
        isLinking && account && setReferralCode(undefined, account.address),
    },
  )

  const { data: evmWalletReady } = useEvmWalletReadiness()
  const isWalletReady =
    wallet?.signer instanceof EthereumSigner ? evmWalletReady : true

  const isLoading =
    transactionValues.isLoading || signTx.isLoading || isChangingFeePaymentAsset
  const hasMultipleFeeAssets =
    props.xcallMeta && props.xcallMeta?.srcChain !== HYDRADX_CHAIN_KEY
      ? false
      : acceptedFeePaymentAssets.length > 1
  const isEditPaymentBalance = !isEnoughPaymentBalance && hasMultipleFeeAssets

  if (isOpenEditFeePaymentAssetModal) return editFeePaymentAssetModal

  const onConfirmClick = () =>
    shouldOpenPolkaJSUrl
      ? window.open(polkadotJSUrl, "_blank")
      : isEnoughPaymentBalance
        ? signTx.mutate()
        : hasMultipleFeeAssets
          ? openEditFeePaymentAssetModal()
          : undefined

  let btnText = t("liquidity.reviewTransaction.modal.confirmButton")

  if (shouldOpenPolkaJSUrl) {
    btnText = t(
      "liquidity.reviewTransaction.modal.confirmButton.openPolkadotJS",
    )
  } else if (isEditPaymentBalance) {
    btnText = t(
      "liquidity.reviewTransaction.modal.confirmButton.notEnoughBalance",
    )
  } else if (signTx.isLoading) {
    btnText = t("liquidity.reviewTransaction.modal.confirmButton.loading")
  }

  const isEvm = isEvmAccount(account?.address)

  const isTippingEnabled = props.xcallMeta
    ? props.xcallMeta?.srcChain === "hydradx" && !isEvm
    : !isEvm

  const isCustomNonceEnabled = isEvm ? shouldUsePermit : true

  return (
    <>
      <ModalScrollableContent
        sx={{
          mx: "calc(-1 * var(--modal-content-padding))",
          p: "var(--modal-content-padding)",
          maxHeight: 280,
        }}
        css={{ backgroundColor: `rgba(${theme.rgbColors.alpha0}, .06)` }}
        content={<ReviewTransactionData address={account?.address} tx={tx} />}
        footer={
          <>
            <div sx={{ mt: 15 }}>
              <ReviewTransactionSummary
                tx={props.tx}
                transactionValues={transactionValues}
                editFeePaymentAssetEnabled={hasMultipleFeeAssets}
                xcallMeta={props.xcallMeta}
                openEditFeePaymentAssetModal={openEditFeePaymentAssetModal}
                onTipChange={isTippingEnabled ? setTipAmount : undefined}
                onNonceChange={
                  isCustomNonceEnabled ? setCustomNonce : undefined
                }
                referralCode={isLinking ? storedReferralCode : undefined}
              />
            </div>
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
                {isIncompatibleWalletProvider ? (
                  <Button
                    variant="primary"
                    onClick={() => toggleWeb3Modal(WalletMode.SubstrateEVM)}
                  >
                    {t(`header.walletConnect.switch.button`)}
                  </Button>
                ) : (
                  <Button
                    text={btnText}
                    variant="primary"
                    isLoading={isPermitTxPending || isLoading}
                    disabled={
                      isPermitTxPending ||
                      !isWalletReady ||
                      !account ||
                      isLoading ||
                      (!isEnoughPaymentBalance && !hasMultipleFeeAssets)
                    }
                    onClick={onConfirmClick}
                  />
                )}

                {isIncompatibleWalletProvider && (
                  <Text fs={12} lh={16} tAlign="center" color="pink600">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.invalidWalletProvider.msg",
                    )}
                  </Text>
                )}

                {!isEnoughPaymentBalance && !transactionValues.isLoading && (
                  <Text fs={12} lh={16} tAlign="center" color="pink600">
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
                {!isWalletReady && (
                  <Text fs={12} lh={16} tAlign="center" color="warning300">
                    {t(
                      "liquidity.reviewTransaction.modal.walletNotReady.warning",
                    )}
                  </Text>
                )}
                {isPermitTxPending && (
                  <Text fs={12} lh={16} tAlign="center" color="warning300">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.pendingPermit.msg",
                    )}
                  </Text>
                )}
              </div>
            </div>
          </>
        }
      />
    </>
  )
}
