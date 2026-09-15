import {
  Button,
  ExternalLink,
  LoadingButton,
} from "@galacticcouncil/ui/components"
import { useAccount } from "@galacticcouncil/web3-connect"
import { WalletProviderType } from "@galacticcouncil/web3-connect/src/config/providers"
import { useTranslation } from "react-i18next"

import { usePolkadotJSExtrinsicUrl } from "@/modules/transactions/hooks/usePolkadotJSExtrinsicUrl"
import {
  TransactionAlertFlag,
  useTransactionAlerts,
} from "@/modules/transactions/hooks/useTransactionAlerts"
import { useTransaction } from "@/modules/transactions/TransactionProvider"
import { TransactionType } from "@/states/transactions"

type ReviewTransactionSubmitButtonProps = {
  disabled?: boolean
}

export const ReviewTransactionSubmitButton = ({
  disabled,
}: ReviewTransactionSubmitButtonProps) => {
  const { t } = useTranslation()
  const { account } = useAccount()

  const {
    tx,
    meta,
    isSigning,
    signAndSubmit,
    isLoading: isTransactionLoading,
    isChangingFeePaymentAsset,
    setFeePaymentModalOpen,
  } = useTransaction()

  const { flags, hasAlerts } = useTransactionAlerts()

  const pjsUrl = usePolkadotJSExtrinsicUrl(tx)

  const isExternalWallet =
    account?.provider === WalletProviderType.ExternalWallet
  const isUnusableOnChain =
    meta.type === TransactionType.Onchain && !account?.canUseOnHydration

  const isSigningBlocked = isExternalWallet || isUnusableOnChain

  if (isSigningBlocked && pjsUrl) {
    return (
      <Button size="large" asChild>
        <ExternalLink href={pjsUrl}>
          {t("transaction.sign.openInPjs")}
        </ExternalLink>
      </Button>
    )
  }

  const isInsufficientFeeBalance = flags.includes(
    TransactionAlertFlag.InsufficientFeeBalance,
  )

  if (isInsufficientFeeBalance) {
    return (
      <LoadingButton
        size="large"
        onClick={() => setFeePaymentModalOpen(true)}
        isLoading={isChangingFeePaymentAsset}
        disabled={isChangingFeePaymentAsset}
      >
        {t("transaction.sign.changeFeePaymentAsset")}
      </LoadingButton>
    )
  }

  const isLoading =
    isSigning || isTransactionLoading || isChangingFeePaymentAsset
  const isDisabled = disabled || isSigningBlocked || hasAlerts || isLoading

  return (
    <LoadingButton
      size="large"
      onClick={signAndSubmit}
      disabled={isDisabled}
      isLoading={isLoading}
    >
      {t("transaction.sign")}
    </LoadingButton>
  )
}
