import BN from "bignumber.js"
import { DataValue } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { PercentageValue } from "components/PercentageValue"
import { useTranslation } from "react-i18next"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { BN_0 } from "utils/constants"

export const BorrowedAssetsStats = () => {
  const { t } = useTranslation()
  const { user, loading } = useAppDataContext()

  const maxBorrowAmount = BN(
    user?.totalBorrowsMarketReferenceCurrency || "0",
  ).plus(user?.availableBorrowsMarketReferenceCurrency || "0")
  const collateralUsagePercent = maxBorrowAmount.eq(0)
    ? BN_0
    : BN(user?.totalBorrowsMarketReferenceCurrency || "0").div(maxBorrowAmount)

  return (
    <div sx={{ flex: "row", gap: [30, 40] }}>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.balance")}
        isLoading={loading}
      >
        <DisplayValue value={Number(user?.totalBorrowsUSD || 0)} isUSD />
      </DataValue>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.apy")}
        tooltip={t("lending.tooltip.apy")}
        isLoading={loading}
      >
        <PercentageValue value={(user?.debtAPY || 0) * 100} />
      </DataValue>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.borrowPower")}
        tooltip={t("lending.tooltip.borrowPower")}
        isLoading={loading}
      >
        <PercentageValue value={Number(collateralUsagePercent) * 100} />
      </DataValue>
    </div>
  )
}
