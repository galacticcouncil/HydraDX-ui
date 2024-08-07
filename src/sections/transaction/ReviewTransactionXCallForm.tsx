import { TransactionResponse } from "@ethersproject/providers"
import { XItemCursor } from "@galacticcouncil/apps"
import { useMutation } from "@tanstack/react-query"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { ReviewTransactionData } from "sections/transaction/ReviewTransactionData"
import { ReviewTransactionXCallSummary } from "sections/transaction/ReviewTransactionSummary"
import { isEvmXCall } from "sections/transaction/ReviewTransactionXCallForm.utils"
import {
  useEvmAccount,
  useWallet,
} from "sections/web3-connect/Web3Connect.utils"
import { EthereumSigner } from "sections/web3-connect/signer/EthereumSigner"
import { Transaction } from "state/store"
import { theme } from "theme"

type TxProps = Required<Pick<Transaction, "xcallMeta" | "xcall">>

type Props = TxProps & {
  title?: string
  onCancel: () => void
  onEvmSigned: (data: { evmTx: TransactionResponse }) => void
  onSignError?: (error: unknown) => void
}

export const ReviewTransactionXCallForm: FC<Props> = ({
  xcall,
  xcallMeta,
  onEvmSigned,
  onCancel,
  onSignError,
}) => {
  const { t } = useTranslation()
  const { account } = useEvmAccount()

  const { wallet } = useWallet()

  const { mutate: signTx, isLoading } = useMutation(async () => {
    try {
      if (!account?.address) throw new Error("Missing active account")
      if (!wallet) throw new Error("Missing wallet")
      if (!wallet.signer) throw new Error("Missing signer")
      if (!isEvmXCall(xcall)) throw new Error("Missing xcall")

      if (wallet?.signer instanceof EthereumSigner) {
        const { srcChain } = xcallMeta

        const evmTx = await wallet.signer.sendTransaction({
          chain: srcChain,
          from: account.address,
          to: xcall.to,
          data: xcall.data,
          value: xcall.value,
        })

        const isApproveTx = evmTx.data.startsWith("0x095ea7b3")
        if (isApproveTx) {
          XItemCursor.reset({
            data: evmTx.data as `0x${string}`,
            hash: evmTx.hash as `0x${string}`,
            nonce: evmTx.nonce,
            to: evmTx.to as `0x${string}`,
          })
        }

        onEvmSigned({ evmTx })
      }
    } catch (error) {
      onSignError?.(error)
    }
  })

  return (
    <>
      <ModalScrollableContent
        sx={{
          mx: "calc(-1 * var(--modal-content-padding))",
          p: "var(--modal-content-padding)",
          maxHeight: 280,
        }}
        css={{ backgroundColor: `rgba(${theme.rgbColors.alpha0}, .06)` }}
        content={
          <ReviewTransactionData address={account?.address} xcall={xcall} />
        }
        footer={
          <>
            <div sx={{ mt: 15 }}>
              <ReviewTransactionXCallSummary
                xcallMeta={xcallMeta}
                xcall={xcall}
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
                onClick={onCancel}
                text={t("liquidity.reviewTransaction.modal.cancel")}
              />
              <div sx={{ flex: "column", justify: "center", gap: 4 }}>
                <Button
                  variant="primary"
                  onClick={() => signTx()}
                  isLoading={isLoading}
                  disabled={isLoading}
                  text={
                    isLoading
                      ? t(
                          "liquidity.reviewTransaction.modal.confirmButton.loading",
                        )
                      : t("liquidity.reviewTransaction.modal.confirmButton")
                  }
                />
                {isLoading && (
                  <Text fs={12} lh={16} tAlign="center" color="warning300">
                    {t(
                      "liquidity.reviewTransaction.modal.confirmButton.warning",
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
