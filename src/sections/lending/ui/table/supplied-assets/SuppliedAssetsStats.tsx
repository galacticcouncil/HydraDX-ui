import { DataValue } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { PercentageValue } from "components/PercentageValue"
import { useTranslation } from "react-i18next"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"

export const SuppliedAssetsStats = () => {
  const { t } = useTranslation()
  const { user, loading } = useAppDataContext()

  return (
    <div sx={{ flex: "row", gap: [30, 40] }}>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.balance")}
        isLoading={loading}
      >
        <DisplayValue value={Number(user?.totalLiquidityUSD || 0)} isUSD />
      </DataValue>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.apy")}
        tooltip={t("lending.tooltip.apy")}
        isLoading={loading}
      >
        <PercentageValue value={(user?.earnedAPY || 0) * 100} />
      </DataValue>
      <DataValue
        size="small"
        font="ChakraPetch"
        labelColor="basic600"
        label={t("lending.collateral")}
        tooltip={t("lending.tooltip.collateral")}
        isLoading={loading}
      >
        <DisplayValue value={Number(user?.totalCollateralUSD || 0)} isUSD />
      </DataValue>
    </div>
  )
}
