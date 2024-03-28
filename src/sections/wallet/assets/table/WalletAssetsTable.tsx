import { flexRender } from "@tanstack/react-table"
import { Switch } from "components/Switch/Switch"
import { TableSortHeader } from "components/Table/Table"
import {
  Table,
  TableBodyContent,
  TableContainer,
  TableData,
  TableHeaderContent,
  TableRow,
  TableTitle,
} from "components/Table/Table.styled"
import { Text } from "components/Typography/Text/Text"
import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { WalletAssetsTableDetails } from "sections/wallet/assets/table/details/WalletAssetsTableDetails"
import { assetsTableStyles } from "sections/wallet/assets/table/WalletAssetsTable.styled"
import { useAssetsTable } from "sections/wallet/assets/table/WalletAssetsTable.utils"
import { WalletTransferModal } from "sections/wallet/transfer/WalletTransferModal"
import { theme } from "theme"
import { WalletAssetsTableActionsMob } from "./actions/WalletAssetsTableActionsMob"
import { Button } from "components/Button/Button"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { Icon } from "components/Icon/Icon"
import { AddTokenModal } from "sections/wallet/addToken/modal/AddTokenModal"
import { AssetsTableData } from "./data/WalletAssetsTableData.utils"
import { EmptyState } from "components/Table/EmptyState"
import EmptyStateIcon from "assets/icons/NoActivities.svg?react"
import { LINKS } from "utils/navigation"
import { CreateTokenModal } from "sections/wallet/createToken/CreateTokenModal"

type Props = {
  data: AssetsTableData[]
  showAll: boolean
  setShowAll: (value: boolean) => void
}

const addTokenEnabled = import.meta.env.VITE_FF_ADD_TOKEN === "true"

export const WalletAssetsTable = ({ data, setShowAll, showAll }: Props) => {
  const { t } = useTranslation()
  const [row, setRow] = useState<AssetsTableData | undefined>(undefined)
  const [addToken, setAddToken] = useState(false)
  const [createToken, setCreateToken] = useState(false)
  const [transferAsset, setTransferAsset] = useState<string | null>(null)

  const isDesktop = useMedia(theme.viewport.gte.sm)

  const table = useAssetsTable(data, {
    onTransfer: setTransferAsset,
  })

  return (
    <>
      <TableContainer css={assetsTableStyles}>
        <TableTitle>
          <Text
            fs={[16, 20]}
            lh={[20, 26]}
            css={{ fontFamily: "FontOver" }}
            fw={500}
            color="white"
          >
            {isDesktop
              ? t("wallet.assets.table.title")
              : t("wallet.header.assets")}
          </Text>
          <div sx={{ flex: "row", gap: 32 }}>
            <Button
              type="button"
              size="micro"
              sx={{ gap: 4 }}
              onClick={() => setCreateToken(true)}
            >
              <div sx={{ flex: "row", align: "center", gap: 4 }}>
                Create token
              </div>
            </Button>
            {addTokenEnabled && (
              <Button
                type="button"
                size="micro"
                sx={{ gap: 4 }}
                onClick={() => setAddToken(true)}
              >
                <div sx={{ flex: "row", align: "center", gap: 4 }}>
                  <Icon icon={<PlusIcon />} />
                  {t("wallet.assets.table.addToken")}
                </div>
              </Button>
            )}
            <Switch
              value={showAll}
              onCheckedChange={(value) => setShowAll(value)}
              size="small"
              name="showAll"
              label={t("wallet.assets.table.toggle")}
            />
          </div>
        </TableTitle>
        <Table css={{ tableLayout: "fixed" }}>
          <TableHeaderContent>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableSortHeader
                    key={header.id}
                    canSort={header.column.getCanSort()}
                    sortDirection={header.column.getIsSorted()}
                    onSort={header.column.getToggleSortingHandler()}
                    css={{
                      width:
                        header.getSize() !== 150
                          ? `${header.getSize()}%`
                          : "auto",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableSortHeader>
                ))}
              </TableRow>
            ))}
          </TableHeaderContent>
          <TableBodyContent>
            {table.options.data.length ? (
              table.getRowModel().rows.map((row, i) => (
                <Fragment key={row.original.id}>
                  <TableRow
                    onClick={() => {
                      isDesktop && row.toggleSelected()
                      !isDesktop && setRow(row.original)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableData key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableData>
                    ))}
                  </TableRow>
                  {row.getIsSelected() && (
                    <TableRow>
                      <TableData
                        colSpan={table.getAllColumns().length}
                        isExpanded
                      >
                        <WalletAssetsTableDetails {...row.original} />
                      </TableData>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <EmptyState
                desc={
                  <>
                    <Icon
                      sx={{ color: "basic600" }}
                      icon={<EmptyStateIcon />}
                    />
                    <Text
                      fs={14}
                      color="basic700"
                      tAlign="center"
                      sx={{ maxWidth: 355, mb: 10 }}
                    >
                      {t("wallet.assets.table.empty.desc")}
                    </Text>
                  </>
                }
                navigateTo={LINKS.cross_chain}
                btnText={t("wallet.assets.table.empty.btn")}
              />
            )}
          </TableBodyContent>
        </Table>

        {transferAsset && (
          <WalletTransferModal
            open
            initialAsset={transferAsset}
            onClose={() => setTransferAsset(null)}
          />
        )}
        {!isDesktop && (
          <WalletAssetsTableActionsMob
            row={row}
            onClose={() => setRow(undefined)}
            onTransferClick={setTransferAsset}
          />
        )}
      </TableContainer>
      {addToken && <AddTokenModal onClose={() => setAddToken(false)} />}
      {createToken && (
        <CreateTokenModal onClose={() => setCreateToken(false)} />
      )}
    </>
  )
}
