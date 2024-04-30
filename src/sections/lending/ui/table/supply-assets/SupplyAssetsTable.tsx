import { DataTable } from "components/DataTable"
import { Switch } from "components/Switch/Switch"
import { useReactTable } from "hooks/useReactTable"
import { useTranslation } from "react-i18next"
import { useLocalStorageBool } from "sections/lending/hooks/useLocalStorageBool"
import {
  useSupplyAssetsTableColumns,
  useSupplyAssetsTableData,
} from "sections/lending/ui/table/supply-assets/SupplyAssetsTable.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useMedia } from "react-use"
import { theme } from "theme"
import { SupplyAssetsMobileRow } from "sections/lending/ui/table/supply-assets/SupplyAssetsMobileRow"

export const SupplyAssetsTable = () => {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useLocalStorageBool("showAllSupplyAssets")

  const { account } = useAccount()

  const { data, isLoading } = useSupplyAssetsTableData({ showAll })
  const columns = useSupplyAssetsTableColumns()

  const table = useReactTable({
    data,
    columns,
    isLoading,
    skeletonRowCount: 6,
  })

  const hasAvailableDeposits =
    !!account &&
    data.filter((reserve) => reserve.availableToDepositUSD !== "0")?.length >= 1

  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <DataTable
      table={table}
      spacing="large"
      title={t("lending.supply.table.title")}
      renderRow={isDesktop ? undefined : SupplyAssetsMobileRow}
      action={
        hasAvailableDeposits && (
          <div css={{ position: "absolute" }} sx={{ right: [10, 20], top: 20 }}>
            <Switch
              value={showAll}
              onCheckedChange={setShowAll}
              name="showAll"
              label={t("wallet.assets.table.toggle")}
            />
          </div>
        )
      }
    />
  )
}
