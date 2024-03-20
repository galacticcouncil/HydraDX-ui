import { Row } from "@tanstack/react-table"
import { Button } from "components/Button/Button"
import { useTranslation } from "react-i18next"
import { getAssetCapData } from "sections/lending/hooks/useAssetCaps"
import { useModalContext } from "sections/lending/hooks/useModal"
import { MobileRow } from "sections/lending/ui/table/components/MobileRow"
import { DashboardReserve } from "sections/lending/utils/dashboardSortUtils"

export const SupplyAssetsMobileRow: React.FC<Row<DashboardReserve>> = ({
  getVisibleCells,
  original,
}) => {
  const { t } = useTranslation()
  const {
    name,
    symbol,
    iconSymbol,
    detailsAddress,
    isActive,
    isPaused,
    isFreezed,
    walletBalance,
    reserve,
    underlyingAsset,
  } = original
  const cells = getVisibleCells()

  const { openSupply } = useModalContext()

  const { supplyCap } = getAssetCapData(reserve)
  const isMaxCapReached = supplyCap.isMaxed

  const disableSupply =
    !isActive ||
    isPaused ||
    isFreezed ||
    Number(walletBalance ?? 0) <= 0 ||
    isMaxCapReached

  return (
    <MobileRow
      name={name}
      symbol={symbol}
      iconSymbol={iconSymbol}
      detailsAddress={detailsAddress}
      cells={cells}
      cellIds={[
        "supplyAPY",
        "walletBalanceUSD",
        "usageAsCollateralEnabledOnUser",
      ]}
      footer={
        <Button
          disabled={disableSupply}
          onClick={() => openSupply(underlyingAsset)}
          fullWidth
          size="small"
        >
          {t("lending.supply")}
        </Button>
      }
    />
  )
}
