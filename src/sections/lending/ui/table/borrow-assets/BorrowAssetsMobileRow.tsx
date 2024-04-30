import { Row } from "@tanstack/react-table"
import { Button } from "components/Button/Button"
import { useModalContext } from "sections/lending/hooks/useModal"
import { MobileRow } from "sections/lending/ui/table/components/MobileRow"
import { DashboardReserve } from "sections/lending/utils/dashboardSortUtils"

export const BorrowAssetsMobileRow: React.FC<Row<DashboardReserve>> = ({
  getVisibleCells,
  original,
}) => {
  const {
    name,
    symbol,
    iconSymbol,
    isFreezed,
    underlyingAsset,
    availableBorrows,
  } = original
  const cells = getVisibleCells()

  const { openBorrow } = useModalContext()

  const disableBorrow = isFreezed || Number(availableBorrows) <= 0

  return (
    <MobileRow
      name={name}
      symbol={symbol}
      iconSymbol={iconSymbol}
      detailsAddress={underlyingAsset}
      cells={cells}
      cellIds={["availableBorrowsInUSD", "variableBorrowRate"]}
      footer={
        <Button
          disabled={disableBorrow}
          onClick={() => openBorrow(underlyingAsset)}
          fullWidth
          size="small"
        >
          Borrow
        </Button>
      }
    />
  )
}
