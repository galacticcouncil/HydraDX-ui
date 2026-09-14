import { Text } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { useAccountBalances } from "@/api/balances"
import { TAsset } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

export type SellAllAlertProps = {
  asset: TAsset
}

export const SellAllAlert: React.FC<SellAllAlertProps> = ({ asset }) => {
  const { t } = useTranslation()

  const { getTransferableBalance } = useAccountBalances()
  const balance = getTransferableBalance(asset.id)

  return (
    <Text fs="p4" lh={1.3} fw={600}>
      {t("transaction.alert.sellAll", {
        value: scaleHuman(balance, asset.decimals),
        symbol: asset.symbol,
      })}
    </Text>
  )
}
