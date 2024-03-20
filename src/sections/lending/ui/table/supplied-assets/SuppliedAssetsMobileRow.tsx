import { Row } from "@tanstack/react-table"
import { Button } from "components/Button/Button"
import { useTranslation } from "react-i18next"
import { useModalContext } from "sections/lending/hooks/useModal"
import { MobileRow } from "sections/lending/ui/table/components/MobileRow"
import { TSuppliedAssetsRow } from "sections/lending/ui/table/supplied-assets/SuppliedAssetsTable.utils"

export const SuppliedAssetsMobileRow: React.FC<Row<TSuppliedAssetsRow>> = ({
  getVisibleCells,
  original,
}) => {
  const { t } = useTranslation()
  const { reserve, underlyingAsset } = original
  const { name, symbol, iconSymbol, isActive, isPaused, isFrozen } = reserve
  const cells = getVisibleCells()

  const { openSupply, openWithdraw } = useModalContext()

  const disableWithdraw = !isActive || isPaused
  const disableSupply = !isActive || isFrozen || isPaused

  return (
    <MobileRow
      name={name}
      symbol={symbol}
      iconSymbol={iconSymbol}
      detailsAddress={underlyingAsset}
      cells={cells}
      cellIds={[
        "underlyingBalanceUSD",
        "supplyAPY",
        "usageAsCollateralEnabledOnUser",
      ]}
      footer={
        <div sx={{ flex: "row", gap: 16 }}>
          <Button
            disabled={disableSupply}
            onClick={() => openSupply(underlyingAsset)}
            fullWidth
            size="small"
          >
            {t("lending.supply")}
          </Button>
          <Button
            disabled={disableWithdraw}
            onClick={() => openWithdraw(underlyingAsset)}
            fullWidth
            size="small"
          >
            {t("lending.withdraw")}
          </Button>
        </div>
      }
    />
  )
}
