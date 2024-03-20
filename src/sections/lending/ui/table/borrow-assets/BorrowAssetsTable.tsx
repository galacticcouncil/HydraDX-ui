import { DataTable } from "components/DataTable"
import { useReactTable } from "hooks/useReactTable"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import {
  useBorrowAssetsTableColumns,
  useBorrowAssetsTableData,
} from "sections/lending/ui/table/borrow-assets/BorrowAssetsTable.utils"
import { Alert } from "components/Alert/Alert"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { BorrowAssetsMobileRow } from "sections/lending/ui/table/borrow-assets/BorrowAssetsMobileRow"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useTranslation } from "react-i18next"

export const BorrowAssetsTable = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useBorrowAssetsTableData()
  const columns = useBorrowAssetsTableColumns()

  const { account } = useAccount()

  const table = useReactTable({
    data,
    columns,
    isLoading,
    skeletonRowCount: 6,
  })

  const { user } = useAppDataContext()

  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <DataTable
      table={table}
      spacing="large"
      title={t("lending.borrow.table.title")}
      renderRow={isDesktop ? undefined : BorrowAssetsMobileRow}
      addons={
        account &&
        user?.totalCollateralMarketReferenceCurrency === "0" && (
          <Alert variant="info" size="small">
            {t("lending.borrow.table.alert")}
          </Alert>
        )
      }
    />
  )
}
