import { useAssets } from "providers/assets"
import { useAccountCurrency, useAccountFeePaymentAssets } from "api/payments"
import SettingsIcon from "assets/icons/SettingsIcon.svg?react"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Button } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { useRpcProvider } from "providers/rpcProvider"
import { useTranslation } from "react-i18next"
import { useEditFeePaymentAsset } from "sections/transaction/ReviewTransactionForm.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { isEvmAccount } from "utils/evm"

export const WalletPaymentAsset = () => {
  const { t } = useTranslation()
  const { featureFlags } = useRpcProvider()
  const { getAsset } = useAssets()
  const { account } = useAccount()
  const { data: accountCurrencyId } = useAccountCurrency(account?.address)
  const accountCurrencyMeta = accountCurrencyId
    ? getAsset(accountCurrencyId)
    : null

  const { acceptedFeePaymentAssetsIds } = useAccountFeePaymentAssets()

  const {
    editFeePaymentAssetModal,
    isOpenEditFeePaymentAssetModal,
    openEditFeePaymentAssetModal,
  } = useEditFeePaymentAsset(acceptedFeePaymentAssetsIds, accountCurrencyId)

  const iconIds = accountCurrencyMeta
    ? accountCurrencyMeta.iconId
    : accountCurrencyId

  const isFeePaymentAssetEditable = acceptedFeePaymentAssetsIds.length > 1

  if (isEvmAccount(account?.address) && !featureFlags.dispatchPermit) {
    return null
  }

  return (
    <div sx={{ flex: "row", align: "center", gap: 8 }}>
      <Text sx={{ opacity: 0.6 }} fs={14} lh={14}>
        {t("wallet.header.feePaymentAsset")}:
      </Text>
      <div sx={{ flex: "row", align: "center", gap: 4, ml: "auto" }}>
        {iconIds && <MultipleAssetLogo size={18} iconId={iconIds} />}
        <Text fs={14} lh={14} font="GeistSemiBold">
          {accountCurrencyMeta?.symbol}
        </Text>
      </div>
      {isFeePaymentAssetEditable && (
        <>
          <Button
            sx={{ py: 6, px: 8 }}
            size="compact"
            onClick={openEditFeePaymentAssetModal}
          >
            <SettingsIcon width={12} height={12} />
          </Button>
          {isOpenEditFeePaymentAssetModal && editFeePaymentAssetModal}
        </>
      )}
    </div>
  )
}
