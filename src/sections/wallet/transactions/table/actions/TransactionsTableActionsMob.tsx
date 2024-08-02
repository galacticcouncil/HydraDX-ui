import BuyIcon from "assets/icons/BuyIcon.svg?react"
import SellIcon from "assets/icons/SellIcon.svg?react"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Badge } from "components/Badge/Badge"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { SActionRow } from "sections/wallet/transactions/table/actions/TransactionsTableActionsMob.styled"
import { AccountColumn } from "sections/wallet/transactions/table/columns/AccountColumn"
import { TTransactionRow } from "sections/wallet/transactions/table/data/TransactionsTableData.utils"

type Props = {
  row?: TTransactionRow
  onClose: () => void
  onSubscanClick?: (hash: string) => void
}

export const TransactionsTableActionsMob = ({
  row,
  onClose,
  onSubscanClick,
}: Props) => {
  const { t } = useTranslation()

  if (!row) return null

  const isDeposit = row.type === "deposit"

  return (
    <Modal open={!!row} isDrawer onClose={onClose} title="">
      <div sx={{ px: 20 }}>
        <div sx={{ flex: "row", align: "center", gap: 8, mb: 20 }}>
          {isDeposit ? (
            <BuyIcon sx={{ color: "green500" }} width={20} height={20} />
          ) : (
            <SellIcon sx={{ color: "brightBlue300" }} width={20} height={20} />
          )}
          <div sx={{ width: "100%" }}>
            <Text color="white" fs={16}>
              {isDeposit
                ? t("wallet.transactions.table.type.deposit")
                : t("wallet.transactions.table.type.withdraw")}
            </Text>
            <div sx={{ flex: "row", justify: "space-between" }}>
              <Text color="whiteish500" fs={13} lh={16}>
                {t("stats.overview.chart.tvl.label.date", {
                  date: row.date,
                })}{" "}
                {t("stats.overview.chart.tvl.label.time", {
                  date: row.date,
                })}
              </Text>
              {row.isCrossChain && (
                <Badge variant="secondary" size="small">
                  {t("wallet.transactions.table.crosschain")}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <SActionRow>
          <Text fs={13} color="whiteish500">
            {t("wallet.transactions.table.header.amount")}
          </Text>
          <div sx={{ flex: "row", gap: 8, align: "center" }}>
            <MultipleAssetLogo size={16} iconId={row.assetIconIds} />

            <Text fs={13} css={{ whiteSpace: "nowrap" }}>
              {t("value.tokenWithSymbol", {
                value: row.amountDisplay,
                symbol: row.assetSymbol,
              })}
            </Text>
          </div>
        </SActionRow>
        <SActionRow>
          <Text fs={13} color="whiteish500">
            {t("wallet.transactions.table.header.source")}
          </Text>
          <AccountColumn
            isCrossChain={row.isCrossChain}
            chain={row.sourceChain}
            address={row.source}
            addressDisplay={row.sourceDisplay}
            color="white"
          />
        </SActionRow>
        <SActionRow>
          <Text fs={13} color="whiteish500">
            {t("wallet.transactions.table.header.destination")}
          </Text>
          <AccountColumn
            isCrossChain={row.isCrossChain}
            chain={row.destChain}
            address={row.dest}
            addressDisplay={row.destDisplay}
            color="white"
          />
        </SActionRow>
        {onSubscanClick && (
          <div sx={{ pt: 40, pb: 20 }}>
            <Button onClick={() => onSubscanClick(row.extrinsicHash)} fullWidth>
              {t("wallet.transactions.table.subscan")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
