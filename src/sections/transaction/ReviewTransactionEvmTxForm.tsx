import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/providers"
import { useMutation } from "@tanstack/react-query"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { ReviewTransactionData } from "sections/transaction/ReviewTransactionData"
import {
  useEvmAccount,
  useWallet,
} from "sections/web3-connect/Web3Connect.utils"
import { MetaMaskSigner } from "sections/web3-connect/wallets/MetaMask/MetaMaskSigner"
import { theme } from "theme"

type Props = {
  title?: string
  onCancel: () => void
  tx: {
    data: TransactionRequest
    abi?: string
  }
  onEvmSigned: (data: { evmTx: TransactionResponse }) => void
}

export const ReviewTransactionEvmTxForm: FC<Props> = ({
  title,
  tx,
  onEvmSigned,
  onCancel,
}) => {
  const { t } = useTranslation()
  const { account } = useEvmAccount()

  const { wallet } = useWallet()

  const { mutate: signTx, isLoading } = useMutation(async () => {
    if (!account?.address) throw new Error("Missing active account")
    if (!wallet) throw new Error("Missing wallet")
    if (!wallet.signer) throw new Error("Missing signer")

    if (wallet?.signer instanceof MetaMaskSigner) {
      const evmTx = await wallet.signer.sendTransaction(tx.data)
      onEvmSigned({ evmTx })
    }
  })

  return (
    <>
      {title && (
        <Text color="basic400" fw={400} sx={{ mb: 16 }}>
          {title}
        </Text>
      )}
      <ModalScrollableContent
        sx={{
          mx: "calc(-1 * var(--modal-content-padding))",
          p: "var(--modal-content-padding)",
          maxHeight: 280,
        }}
        css={{ backgroundColor: `rgba(${theme.rgbColors.alpha0}, .06)` }}
        content={
          <ReviewTransactionData address={account?.address} evmTx={tx} />
        }
        footer={
          <div sx={{ mt: 15 }}>
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
          </div>
        }
      />
    </>
  )
}
