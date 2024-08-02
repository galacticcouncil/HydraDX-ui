import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import TransferIcon from "assets/icons/TransferIcon.svg?react"
import { useMemo } from "react"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"
import { ButtonTransparent } from "components/Button/Button"
import ChevronDownIcon from "assets/icons/ChevronDown.svg?react"
import ChevronRightIcon from "assets/icons/ChevronRight.svg?react"
import { useTranslation } from "react-i18next"
import { formatDate } from "utils/formatting"
import { useMedia } from "react-use"
import { TableAction } from "components/Table/Table"
import { useClaimBond } from "sections/trade/sections/bonds/Bonds.utils"
import BN from "bignumber.js"
import { Icon } from "components/Icon/Icon"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { useNavigate } from "@tanstack/react-location"
import { LINKS } from "utils/navigation"
import { Transaction } from "./transactions/Transactions.utils"
import { useDisplayPrice } from "utils/displayAsset"
import { DollarAssetValue } from "components/DollarAssetValue/DollarAssetValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { useAssets } from "providers/assets"

export type BondTableItem = {
  assetId: string
  maturity?: number
  balance?: BN
  price: string
  balanceHuman?: string
  bondId: string
  isSale: boolean
  assetIn?: string
  averagePrice: BN | undefined
  events: Transaction[]
  name: string
  symbol: string
}

export type Config = {
  showTransactions?: boolean
  enableAnimation?: boolean
  showTransfer?: boolean
  onTransfer: (assetId: string) => void
}

export const BondCell = ({ bondId }: { bondId: string }) => {
  const { getBond } = useAssets()
  const bond = getBond(bondId)

  if (!bond) return null

  return (
    <div
      sx={{
        flex: "row",
        align: "center",
        gap: 8,
      }}
    >
      <Icon
        icon={<AssetLogo id={bond.underlyingAssetId} />}
        size={[24, 27]}
        sx={{ flexShrink: 0 }}
        css={{ width: "min-content" }}
      />
      <div sx={{ flex: "column" }}>
        <Text fs={14} sx={{ mt: 3 }} font="GeistSemiBold">
          {bond.symbol}
        </Text>
        <Text fs={13} sx={{ mt: 3 }} color="whiteish500">
          {bond.name}
        </Text>
      </div>
    </div>
  )
}

export const useActiveBondsTable = (data: BondTableItem[], config: Config) => {
  const { t } = useTranslation()
  const { accessor, display } = createColumnHelper<BondTableItem>()
  const { getAsset } = useAssets()

  const claim = useClaimBond()
  const navigate = useNavigate()

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    assetId: true,
    maturity: isDesktop,
    balance: true,
    price: isDesktop,
    averagePrice: isDesktop,
    actions: isDesktop,
  }

  const columns = useMemo(
    () => [
      accessor("bondId", {
        header: t("bond"),
        cell: ({ getValue }) =>
          getValue() ? <BondCell bondId={getValue()} /> : null,
      }),
      accessor("maturity", {
        header: () => (
          <div sx={{ textAlign: ["right", "center"] }}>
            {t("bonds.maturity")}
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue()

          return value !== undefined ? (
            <Text fs={14} color="white" tAlign="right">
              {formatDate(new Date(value), "dd/MM/yyyy")}
            </Text>
          ) : null
        },
      }),
      accessor("balanceHuman", {
        header: () => (
          <div sx={{ textAlign: "center" }}>{t("bonds.table.balance")}</div>
        ),
        cell: ({ row }) => <BondBalance bond={row.original} />,
      }),
      accessor("averagePrice", {
        header: () => (
          <div sx={{ textAlign: "center" }} css={{ whiteSpace: "normal" }}>
            {t("bonds.table.price")}
          </div>
        ),
        cell: ({ getValue, row }) => {
          const accumulatedAssetId = row.original.assetIn
          const meta = accumulatedAssetId
            ? getAsset(accumulatedAssetId)
            : undefined

          return (
            <Text fs={14} color="white" tAlign="center">
              {t("value.tokenWithSymbol", {
                value: getValue(),
                symbol: meta?.symbol,
              })}
            </Text>
          )
        },
      }),
      display({
        id: "actions",
        cell: ({ row }) => {
          const { maturity, bondId, balance, isSale, assetIn } = row.original
          const isClaimDisabled =
            !bondId ||
            !balance ||
            claim.isLoading ||
            !maturity ||
            maturity >= new Date().getTime()

          return (
            <div sx={{ flex: "row", gap: 10, justify: "end", pr: 16 }}>
              {config.showTransfer && (
                <TableAction
                  onClick={() =>
                    navigate({
                      to: LINKS.bond,
                      search: { assetIn, assetOut: bondId },
                    })
                  }
                  disabled={!isSale}
                >
                  {t("bonds.btn")}
                </TableAction>
              )}
              {
                <TableAction
                  variant={config.showTransfer ? "secondary" : "primary"}
                  isLoading={claim.isLoading}
                  disabled={isClaimDisabled}
                  onClick={() =>
                    bondId &&
                    balance &&
                    claim.mutate({ bondId, amount: balance.toString() })
                  }
                >
                  {t("bonds.table.claim")}
                </TableAction>
              }
              {config.showTransfer && bondId && (
                <TableAction
                  icon={<TransferIcon />}
                  onClick={() => config.onTransfer(bondId)}
                >
                  {t("bonds.table.transfer")}
                </TableAction>
              )}
              {config.showTransactions && (
                <ButtonTransparent
                  onClick={() => row.toggleSelected()}
                  css={{
                    color: theme.colors.iconGray,
                    opacity: row.getIsSelected() ? "1" : "0.5",
                    transform: row.getIsSelected()
                      ? "rotate(180deg)"
                      : undefined,
                  }}
                >
                  <ChevronDownIcon />
                </ButtonTransparent>
              )}
            </div>
          )
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.showTransactions, config.showTransfer, claim.isLoading, isDesktop],
  )

  return useReactTable({
    data,
    columns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}

const BondBalance = ({ bond }: { bond: BondTableItem }) => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const displayPrice = useDisplayPrice(bond.bondId)
  const usdValue =
    displayPrice.data?.spotPrice.isPositive() && bond.balanceHuman
      ? displayPrice.data?.spotPrice.times(bond.balanceHuman)
      : undefined

  return (
    <div
      sx={{
        flex: "row",
        gap: 1,
        align: "center",
        justify: ["end", "center"],
        textAlign: "center",
      }}
    >
      <div sx={{ flex: "column", gap: 2 }}>
        <Text fs={14} color="white" tAlign="center">
          {t("value.token", { value: bond.balanceHuman })}
        </Text>
        {usdValue && (
          <DollarAssetValue
            value={usdValue}
            wrapper={(children) => (
              <Text
                fs={13}
                lh={13}
                fw={500}
                css={{ color: `rgba(${theme.rgbColors.paleBlue}, 0.61)` }}
              >
                {children}
              </Text>
            )}
          >
            <DisplayValue value={usdValue} />
          </DollarAssetValue>
        )}
      </div>

      {!isDesktop && (
        <ButtonTransparent css={{ color: theme.colors.iconGray }}>
          <Icon sx={{ color: "darkBlue300" }} icon={<ChevronRightIcon />} />
        </ButtonTransparent>
      )}
    </div>
  )
}
