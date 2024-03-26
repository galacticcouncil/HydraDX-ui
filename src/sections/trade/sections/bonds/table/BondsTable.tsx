import { flexRender } from "@tanstack/react-table"
import {
  Table,
  TableBodyContent,
  TableContainer,
  TableData,
  TableHeader,
  TableHeaderContent,
  TableRow,
  TableTitle,
} from "components/Table/Table.styled"
import { Fragment, useState } from "react"
import { useMedia } from "react-use"
import { theme } from "theme"
import { BondTableItem, useActiveBondsTable } from "./BondsTable.utils"
import { Transactions } from "./transactions/Transactions"
import { Text } from "components/Typography/Text/Text"
import { WalletTransferModal } from "sections/wallet/transfer/WalletTransferModal"
import { Switch } from "components/Switch/Switch"
import { useTranslation } from "react-i18next"
import { BondTableMobileDrawer } from "./BondTableMobileDrawer"

type Props = {
  title: string
  data: BondTableItem[]
  showTransactions?: boolean
  showTransfer?: boolean
  allAssets: boolean
  setAllAssets: (allAssets: boolean) => void
}

export const BondsTable = ({
  title,
  data,
  showTransactions,
  showTransfer,
  allAssets,
  setAllAssets,
}: Props) => {
  const { t } = useTranslation()
  const [row, setRow] = useState<BondTableItem | undefined>(undefined)
  const [transferAsset, setTransferAsset] = useState<string | null>(null)

  const isDesktop = useMedia(theme.viewport.gte.sm)

  const table = useActiveBondsTable(data, {
    showTransactions,
    showTransfer,
    onTransfer: setTransferAsset,
  })

  return (
    <>
      <TableContainer>
        <TableTitle>
          <Text
            fs={[16, 20]}
            lh={[20, 26]}
            css={{ fontFamily: "FontOver" }}
            fw={500}
            color="white"
          >
            {title}
          </Text>
          {showTransfer && (
            <Switch
              value={allAssets}
              onCheckedChange={(value) => setAllAssets(value)}
              name="showAll"
              label={t("bonds.table.switcher")}
            />
          )}
        </TableTitle>
        <Table>
          <TableHeaderContent>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} header>
                {hg.headers.map((header) => (
                  <TableHeader key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHeader>
                ))}
              </TableRow>
            ))}
          </TableHeaderContent>
          <TableBodyContent>
            {table.getRowModel().rows.map((row, i) => (
              <Fragment key={row.id}>
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
                {row.getIsSelected() &&
                  showTransactions &&
                  row.original.events.length && (
                    <TableRow>
                      <td colSpan={table.getAllColumns().length}>
                        <Transactions
                          data={row.original.events}
                          onHide={() => row.toggleSelected()}
                        />
                      </td>
                    </TableRow>
                  )}
              </Fragment>
            ))}
          </TableBodyContent>
        </Table>
      </TableContainer>

      {transferAsset && (
        <WalletTransferModal
          open
          initialAsset={transferAsset}
          onClose={() => setTransferAsset(null)}
        />
      )}

      {!isDesktop && row && (
        <BondTableMobileDrawer
          data={row}
          onClose={() => setRow(undefined)}
          config={{
            showTransactions,
            showTransfer,
            onTransfer: setTransferAsset,
          }}
        />
      )}
    </>
  )
}
