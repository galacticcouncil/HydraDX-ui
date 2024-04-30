import { DataTable } from "components/DataTable"
import { Text } from "components/Typography/Text/Text"
import { useReactTable } from "hooks/useReactTable"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { BorrowedAssetsMobileRow } from "sections/lending/ui/table/borrowed-assets/BorrowedAssetsMobileRow"
import { BorrowedAssetsStats } from "sections/lending/ui/table/borrowed-assets/BorrowedAssetsStats"
import {
  useBorrowedAssetsTableColumns,
  useBorrowedAssetsTableData,
} from "sections/lending/ui/table/borrowed-assets/BorrowedAssetsTable.utils"
import { theme } from "theme"

export const BorrowedAssetsTable = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useBorrowedAssetsTableData()
  const columns = useBorrowedAssetsTableColumns()

  const table = useReactTable({
    data,
    columns,
    isLoading,
    skeletonRowCount: 6,
  })

  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <DataTable
      table={table}
      spacing="large"
      title={t("lending.borrowed.table.title")}
      background="transparent"
      addons={<BorrowedAssetsStats />}
      renderRow={isDesktop ? undefined : BorrowedAssetsMobileRow}
      emptyFallback={
        <Text color="basic700" fs={14}>
          {t("lending.borrowed.table.empty")}
        </Text>
      }
    />
  )
}
