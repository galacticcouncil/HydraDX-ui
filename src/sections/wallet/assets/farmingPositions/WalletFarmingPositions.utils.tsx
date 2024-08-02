import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useBestNumber } from "api/chain"
import { useAccountPositions } from "api/deposits"
import BN from "bignumber.js"
import { DollarAssetValue } from "components/DollarAssetValue/DollarAssetValue"
import { Text } from "components/Typography/Text/Text"
import { isAfter } from "date-fns"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { useAllFarmDeposits } from "sections/pools/farms/position/FarmingPosition.utils"
import { theme } from "theme"
import { getFloatingPointAmount } from "utils/balance"
import { getEnteredDate } from "utils/block"
import { BN_0 } from "utils/constants"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { AssetTableName } from "components/AssetTableName/AssetTableName"
import { arraySearch, isNotNil } from "utils/helpers"
import { WalletAssetsHydraPositionsDetails } from "sections/wallet/assets/hydraPositions/details/WalletAssetsHydraPositionsDetails"
import { ButtonTransparent } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import ChevronRightIcon from "assets/icons/ChevronRight.svg?react"
import { TLPData } from "utils/omnipool"
import { useAssets } from "providers/assets"

export const useFarmingPositionsTable = (data: FarmingTablePosition[]) => {
  const { t } = useTranslation()
  const { accessor } = createColumnHelper<FarmingTablePosition>()
  const [sorting, onSortingChange] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    symbol: true,
    date: isDesktop,
    shares: isDesktop,
    position: true,
  }

  const columns = useMemo(
    () => [
      accessor("symbol", {
        id: "symbol",
        header: isDesktop
          ? t("wallet.assets.farmingPositions.header.name")
          : t("selectAssets.asset"),
        sortingFn: (a, b) => a.original.symbol.localeCompare(b.original.symbol),
        cell: ({ row }) => (
          <AssetTableName {...row.original} id={row.original.assetId} />
        ),
      }),
      accessor("date", {
        id: "date",
        header: t("wallet.assets.farmingPositions.header.date"),
        sortingFn: (a, b) =>
          isAfter(a.original.date, b.original.date) ? 1 : -1,
        cell: ({ row }) => (
          <Text fs={14} fw={500} color="white">
            {t("wallet.assets.farmingPositions.data.date", {
              date: row.original.date,
            })}
          </Text>
        ),
      }),
      accessor("shares", {
        id: "shares",
        header: t("wallet.assets.farmingPositions.header.initial"),
        sortingFn: (a, b) => (a.original.shares.gt(b.original.shares) ? 1 : -1),
        cell: ({ row }) => {
          return isXYKPosition(row.original.position) ? (
            <Text fs={14} fw={500} color="white">
              -
            </Text>
          ) : (
            <>
              <Text fs={14} fw={500} color="white">
                {t("value.token", {
                  value: row.original.position.amountShifted,
                })}
              </Text>
              <DollarAssetValue
                value={row.original.position.amountDisplay}
                wrapper={(children) => (
                  <Text fs={[12, 13]} lh={[14, 16]} color="whiteish500">
                    {children}
                  </Text>
                )}
              >
                <DisplayValue value={row.original.position.amountDisplay} />
              </DollarAssetValue>
            </>
          )
        },
      }),
      accessor("position", {
        id: "position",
        header: t("wallet.assets.farmingPositions.header.value"),
        sortingFn: (a, b) =>
          a.original.position.valueDisplay.gt(b.original.position.valueDisplay)
            ? 1
            : -1,
        cell: ({ row }) => {
          const position = row.original.position
          const isXYK = isXYKPosition(position)

          return (
            <div
              sx={{
                flex: "row",
                gap: 1,
                align: "center",
                justify: ["end", "start"],
                textAlign: "center",
              }}
            >
              <WalletAssetsHydraPositionsDetails
                assetId={row.original.assetId}
                lrna={isXYK ? undefined : position.lrnaShifted}
                amount={isXYK ? undefined : position.valueShifted}
                amountPair={isXYK ? position.balances : undefined}
                amountDisplay={position.valueDisplay}
              />
              {!isDesktop && (
                <ButtonTransparent>
                  <Icon
                    sx={{ color: "darkBlue300" }}
                    icon={<ChevronRightIcon />}
                  />
                </ButtonTransparent>
              )}
            </div>
          )
        },
      }),
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDesktop],
  )

  return useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}

export const useFarmingPositionsData = ({
  search,
}: {
  search?: string
} = {}) => {
  const { getShareTokenByAddress, getAsset } = useAssets()
  const { omnipoolDeposits = [], xykDeposits = [] } =
    useAccountPositions().data ?? {}
  const { omnipool, xyk } = useAllFarmDeposits()

  const bestNumber = useBestNumber()

  const queries = [bestNumber]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (!omnipoolDeposits || !bestNumber.data) return []

    const rows = [...omnipoolDeposits, ...xykDeposits]
      .map((deposit) => {
        const depositId = deposit.id
        const isXyk = deposit.isXyk
        const poolId = deposit.data.ammPoolId.toString()

        const meta = isXyk ? getShareTokenByAddress(poolId) : getAsset(poolId)

        if (!meta) return undefined

        const { symbol, decimals, name, id } = meta
        const latestEnteredAtBlock = deposit.data.yieldFarmEntries.reduce(
          (acc, curr) =>
            acc.lt(curr.enteredAt.toBigNumber())
              ? curr.enteredAt.toBigNumber()
              : acc,
          BN_0,
        )

        const date = getEnteredDate(
          latestEnteredAtBlock,
          bestNumber.data.relaychainBlockNumber.toBigNumber(),
        )
        const shares = getFloatingPointAmount(
          deposit.data.shares.toBigNumber(),
          decimals,
        )

        let position: XYKPosition | TLPData
        if (isXyk) {
          const values = xyk[meta.id]?.find(
            (value) => value.depositId === deposit.id,
          )

          if (values?.amountUSD) {
            const { assetA, assetB, amountUSD } = values

            position = {
              balances: [
                {
                  amount: assetA.amount,
                  symbol: assetA.symbol,
                },
                {
                  amount: assetB.amount,
                  symbol: assetB.symbol,
                },
              ],
              valueDisplay: amountUSD,
            }
          } else {
            return undefined
          }
        } else {
          const omnipoolDeposit = omnipool[poolId]?.find(
            (d) => d.depositId?.toString() === deposit.id,
          )

          if (omnipoolDeposit) {
            position = omnipoolDeposit
          } else {
            return undefined
          }
        }

        return {
          id: depositId,
          symbol,
          name,
          date,
          shares,
          position,
          assetId: id,
        }
      })
      .filter(isNotNil)
      .sort((a, b) =>
        b.position.valueDisplay.minus(a.position.valueDisplay).toNumber(),
      )

    return search ? arraySearch(rows, search, ["symbol", "name"]) : rows
  }, [
    omnipoolDeposits,
    bestNumber.data,
    xykDeposits,
    search,
    getShareTokenByAddress,
    getAsset,
    xyk,
    omnipool,
  ])

  return { data, isLoading }
}

export const isXYKPosition = (
  position: XYKPosition | TLPData,
): position is XYKPosition => !!(position as XYKPosition).balances

type XYKPosition = {
  valueDisplay: BN
  balances: { amount: BN; symbol: string }[]
}

export type FarmingTablePosition = {
  id: string
  assetId: string
  symbol: string
  name: string
  date: Date
  shares: BN
  position: XYKPosition | TLPData
}
