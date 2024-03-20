import { useNavigate } from "@tanstack/react-location"
import { DataTable } from "components/DataTable"
import { EmptySearchState } from "components/EmptySearchState/EmptySearchState"
import { useReactTable } from "hooks/useReactTable"
import React from "react"
import { useTranslation } from "react-i18next"
import { ROUTES } from "sections/lending/components/primitives/Link"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import {
  useMarketAssetsTableColumns,
  useMarketAssetsTableData,
} from "sections/lending/ui/table/market-assets/MarketAssetsTable.utils"

type MarketAssetsTableProps = {
  search?: string
}

export const MarketAssetsTable: React.FC<MarketAssetsTableProps> = ({
  search,
}) => {
  const { t } = useTranslation()
  const { data, isLoading } = useMarketAssetsTableData({ search })
  const columns = useMarketAssetsTableColumns()
  const { currentMarket } = useProtocolDataContext()

  const table = useReactTable({
    data,
    columns,
    isLoading,
    columnsHiddenOnMobile: [
      "supplyAPY",
      "totalDebtUSD",
      "variableBorrowAPY",
      "actions",
    ],
  })

  const navigate = useNavigate()

  return (
    <DataTable
      table={table}
      spacing="large"
      title={t("lending.market.table.title")}
      hoverable
      emptyFallback={<EmptySearchState />}
      onRowClick={(row) =>
        navigate({
          to: ROUTES.reserveOverview(
            row?.original.underlyingAsset,
            currentMarket,
          ),
        })
      }
    />
  )
}
