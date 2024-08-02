import { flexRender } from "@tanstack/react-table"
import { TableSortHeader } from "components/Table/Table"
import {
  StatsTableContainer,
  StatsTableTitle,
  Table,
  TableBodyContent,
  TableData,
  TableHeaderContent,
  TableRowStats,
} from "components/Table/Table.styled"
import { Text } from "components/Typography/Text/Text"
import { useReferralsTable } from "./ReferralsTable.utils"
import { TReferralsTableData } from "./data/ReferralsTableData.utils"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { WalletTransferModal } from "sections/wallet/transfer/WalletTransferModal"
import { useAssets } from "providers/assets"

type Props = {
  data: TReferralsTableData
}

export const ReferralsTable = ({ data }: Props) => {
  const { native } = useAssets()
  const { t } = useTranslation()
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null)

  const table = useReferralsTable(data, { onTipUser: setRecipientAddress })

  return (
    <>
      <StatsTableContainer>
        <StatsTableTitle>
          <Text fs={15} lh={20} color="white" font="GeistMono">
            {t("referrals.table.header.title")}
          </Text>
        </StatsTableTitle>
        <Table>
          <TableHeaderContent>
            {table.getHeaderGroups().map((hg) => (
              <TableRowStats key={hg.id} header>
                {hg.headers.map((header) => (
                  <TableSortHeader
                    key={header.id}
                    canSort={header.column.getCanSort()}
                    sortDirection={header.column.getIsSorted()}
                    onSort={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableSortHeader>
                ))}
              </TableRowStats>
            ))}
          </TableHeaderContent>
          <TableBodyContent>
            {table.getRowModel().rows.map((row) => (
              <TableRowStats key={row.id} css={{ cursor: "pointer" }}>
                {row.getVisibleCells().map((cell) => (
                  <TableData
                    key={cell.id}
                    css={{
                      "&:last-of-type": {
                        paddingLeft: 0,
                      },
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableData>
                ))}
              </TableRowStats>
            ))}
          </TableBodyContent>
        </Table>
      </StatsTableContainer>
      {recipientAddress && (
        <WalletTransferModal
          open
          initialAsset={native.id}
          initialRecipient={recipientAddress}
          onClose={() => setRecipientAddress(null)}
        />
      )}
    </>
  )
}
