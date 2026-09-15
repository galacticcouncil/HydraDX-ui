import { Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import Big from "big.js"
import { useTranslation } from "react-i18next"

import { AssetProgressStat } from "@/components/AssetProgressStat"
import { useInitialOtcOfferAmount } from "@/modules/trade/otc/table/columns/OfferStatusColumn.utils"
import { OtcOffer } from "@/modules/trade/otc/table/OtcTable.query"
import { scaleHuman } from "@/utils/formatting"

const DEFAULT_INITIAL_AMOUNT = 222_222

type StableBondsCurrencyProps = {
  order: OtcOffer
}

export const StableBondsCurrency: React.FC<StableBondsCurrencyProps> = ({
  order,
}) => {
  const { assetIn: asset, assetAmountIn: amount } = order
  const { t } = useTranslation(["common", "strategies"])
  const { data, isLoading } = useInitialOtcOfferAmount(
    order.id,
    order.isPartiallyFillable,
  )

  const isFillable = Big(amount).gt(0)

  const initialAmount =
    data &&
    data.assetInId === order.assetIn.id &&
    data.assetOutId === order.assetOut.id
      ? Big(scaleHuman(data.amountInInitial, asset.decimals))
      : Big(DEFAULT_INITIAL_AMOUNT)

  const remainingPct =
    initialAmount && !initialAmount.eq(0)
      ? Big(amount).div(initialAmount).mul(100).toNumber()
      : 0

  return (
    <AssetProgressStat
      assetId={asset.id}
      layout="grid"
      progressPct={isFillable ? remainingPct : 0}
      isProgressLoading={isFillable && isLoading}
      value={
        <Text
          font="primary"
          fs="h6"
          fw={600}
          decoration={isFillable ? "none" : "line-through"}
          color={isFillable ? getToken("text.high") : getToken("text.low")}
        >
          {isFillable
            ? t("number", { value: amount })
            : t("strategies:bonds.soldOut")}
        </Text>
      }
    />
  )
}
