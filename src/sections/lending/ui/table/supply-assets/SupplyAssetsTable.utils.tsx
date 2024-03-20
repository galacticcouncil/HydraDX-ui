import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers"
import { USD_DECIMALS, valueToBigNumber } from "@aave/math-utils"
import { createColumnHelper } from "@tanstack/react-table"
import ChevronRight from "assets/icons/ChevronRight.svg?react"
import BigNumber from "bignumber.js"
import { Button } from "components/Button/Button"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Link } from "components/Link/Link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ROUTES } from "sections/lending/components/primitives/Link"
import { NoData } from "sections/lending/components/primitives/NoData"
import {
  ComputedReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useWalletBalances } from "sections/lending/hooks/app-data-provider/useWalletBalances"
import { getAssetCapData } from "sections/lending/hooks/useAssetCaps"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { useRootStore } from "sections/lending/store/root"
import { fetchIconSymbolAndName } from "sections/lending/ui-config/reservePatches"
import { AssetNameColumn } from "sections/lending/ui/columns/AssetNameColumn"
import { CollateralColumn } from "sections/lending/ui/columns/CollateralColumn"
import { IncentivesCard } from "sections/lending/ui/incentives/IncentivesCard"
import { DashboardReserve } from "sections/lending/utils/dashboardSortUtils"

export type TSupplyAssetsTable = typeof useSupplyAssetsTableData
export type TSupplyAssetsTableData = ReturnType<TSupplyAssetsTable>
export type TSupplyAssetsRow = TSupplyAssetsTableData["data"][number]

const { accessor, display } = createColumnHelper<TSupplyAssetsRow>()

export const useSupplyAssetsTableColumns = () => {
  const { t } = useTranslation()
  const { openSupply } = useModalContext()
  const { currentMarket } = useProtocolDataContext()

  return useMemo(
    () => [
      accessor("symbol", {
        header: t("lending.asset"),
        cell: ({ row }) => (
          <AssetNameColumn
            detailsAddress={row.original.detailsAddress}
            symbol={row.original.symbol}
            iconSymbol={row.original.iconSymbol}
          />
        ),
      }),
      accessor("walletBalanceUSD", {
        header: t("lending.walletBalance"),
        sortingFn: (a, b) =>
          Number(a.original.walletBalanceUSD) -
          Number(b.original.walletBalanceUSD),
        cell: ({ row }) => {
          const { walletBalance, walletBalanceUSD } = row.original
          const value = Number(walletBalance ?? 0)
          const valueUsd = Number(walletBalanceUSD ?? 0)

          const { supplyCap } = getAssetCapData(row.original.reserve)
          const isMaxCapReached = supplyCap.isMaxed

          const disabled = value === 0 || isMaxCapReached
          return (
            <span sx={{ color: disabled ? "basic500" : "white" }}>
              {t("value.token", { value })}
              {value > 0 && (
                <span
                  css={{ display: "block" }}
                  sx={{ color: "basic300", fontSize: 12, lineHeight: 16 }}
                >
                  <DisplayValue value={valueUsd} isUSD />
                </span>
              )}
            </span>
          )
        },
      }),
      accessor("supplyAPY", {
        header: t("lending.apy"),
        meta: {
          sx: {
            textAlign: "center",
          },
        },
        cell: ({ row }) => {
          const { supplyAPY, aIncentivesData, symbol } = row.original

          return (
            <IncentivesCard
              value={supplyAPY}
              incentives={aIncentivesData}
              symbol={symbol}
            />
          )
        },
      }),
      accessor("usageAsCollateralEnabledOnUser", {
        header: t("lending.supply.table.canBeCollateral"),
        meta: {
          sx: {
            textAlign: "center",
          },
        },
        cell: ({ row }) => {
          const { isIsolated, usageAsCollateralEnabledOnUser } = row.original
          const { debtCeiling } = getAssetCapData(row.original.reserve)
          return (
            <>
              {debtCeiling.isMaxed ? (
                <NoData />
              ) : (
                <CollateralColumn
                  isIsolated={isIsolated}
                  usageAsCollateralEnabled={usageAsCollateralEnabledOnUser}
                />
              )}
            </>
          )
        },
      }),
      display({
        id: "actions",
        meta: {
          sx: {
            textAlign: "end",
          },
        },
        cell: ({ row }) => {
          const {
            isActive,
            isPaused,
            walletBalance,
            isFreezed,
            underlyingAsset,
            detailsAddress,
          } = row.original

          const { supplyCap } = getAssetCapData(row.original.reserve)
          const isMaxCapReached = supplyCap.isMaxed

          const disableSupply =
            !isActive ||
            isPaused ||
            isFreezed ||
            Number(walletBalance ?? 0) <= 0 ||
            isMaxCapReached
          return (
            <div sx={{ flex: "row", justify: "end" }}>
              <Button
                disabled={disableSupply}
                onClick={() => openSupply(underlyingAsset)}
                size="micro"
              >
                {t("lending.supply")}
              </Button>
              <Link
                to={ROUTES.reserveOverview(
                  detailsAddress || underlyingAsset,
                  currentMarket,
                )}
              >
                <ChevronRight sx={{ color: "iconGray", mr: -8 }} />
              </Link>
            </div>
          )
        },
      }),
    ],
    [currentMarket, openSupply, t],
  )
}

export const useSupplyAssetsTableData = ({ showAll }: { showAll: boolean }) => {
  const currentNetworkConfig = useRootStore(
    (store) => store.currentNetworkConfig,
  )
  const currentMarketData = useRootStore((store) => store.currentMarketData)
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: loadingReserves,
  } = useAppDataContext()
  const { walletBalances, loading } = useWalletBalances(currentMarketData)

  const { baseAssetSymbol } = currentNetworkConfig

  const data = useMemo(() => {
    const tokensToSupply = reserves
      .filter(
        (reserve: ComputedReserveData) =>
          !(reserve.isFrozen || reserve.isPaused),
      )
      .map((reserve: ComputedReserveData) => {
        const walletBalance = walletBalances[reserve.underlyingAsset]?.amount
        const walletBalanceUSD =
          walletBalances[reserve.underlyingAsset]?.amountUSD
        let availableToDeposit = valueToBigNumber(walletBalance)
        if (reserve.supplyCap !== "0") {
          availableToDeposit = BigNumber.min(
            availableToDeposit,
            new BigNumber(reserve.supplyCap)
              .minus(reserve.totalLiquidity)
              .multipliedBy("0.995"),
          )
        }
        const availableToDepositUSD = valueToBigNumber(availableToDeposit)
          .multipliedBy(reserve.priceInMarketReferenceCurrency)
          .multipliedBy(marketReferencePriceInUsd)
          .shiftedBy(-USD_DECIMALS)
          .toString()

        const isIsolated = reserve.isIsolated
        const hasDifferentCollateral = user?.userReservesData.find(
          (userRes) =>
            userRes.usageAsCollateralEnabledOnUser &&
            userRes.reserve.id !== reserve.id,
        )

        const usageAsCollateralEnabledOnUser = !user?.isInIsolationMode
          ? reserve.reserveLiquidationThreshold !== "0" &&
            (!isIsolated || (isIsolated && !hasDifferentCollateral))
          : !isIsolated
          ? false
          : !hasDifferentCollateral

        if (reserve.isWrappedBaseAsset) {
          let baseAvailableToDeposit = valueToBigNumber(
            walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount,
          )
          if (reserve.supplyCap !== "0") {
            baseAvailableToDeposit = BigNumber.min(
              baseAvailableToDeposit,
              new BigNumber(reserve.supplyCap)
                .minus(reserve.totalLiquidity)
                .multipliedBy("0.995"),
            )
          }
          const baseAvailableToDepositUSD = valueToBigNumber(
            baseAvailableToDeposit,
          )
            .multipliedBy(reserve.priceInMarketReferenceCurrency)
            .multipliedBy(marketReferencePriceInUsd)
            .shiftedBy(-USD_DECIMALS)
            .toString()
          return [
            {
              ...reserve,
              reserve,
              underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
              ...fetchIconSymbolAndName({
                symbol: baseAssetSymbol,
                underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
              }),
              walletBalance:
                walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount,
              walletBalanceUSD:
                walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amountUSD,
              availableToDeposit: baseAvailableToDeposit.toString(),
              availableToDepositUSD: baseAvailableToDepositUSD,
              usageAsCollateralEnabledOnUser,
              detailsAddress: reserve.underlyingAsset,
              id: reserve.id + "base",
            },
            {
              ...reserve,
              reserve,
              walletBalance,
              walletBalanceUSD,
              availableToDeposit:
                availableToDeposit.toNumber() <= 0
                  ? "0"
                  : availableToDeposit.toString(),
              availableToDepositUSD:
                Number(availableToDepositUSD) <= 0
                  ? "0"
                  : availableToDepositUSD.toString(),
              usageAsCollateralEnabledOnUser,
              detailsAddress: reserve.underlyingAsset,
            },
          ]
        }

        return {
          ...reserve,
          reserve,
          walletBalance,
          walletBalanceUSD,
          availableToDeposit:
            availableToDeposit.toNumber() <= 0
              ? "0"
              : availableToDeposit.toString(),
          availableToDepositUSD:
            Number(availableToDepositUSD) <= 0
              ? "0"
              : availableToDepositUSD.toString(),
          usageAsCollateralEnabledOnUser,
          detailsAddress: reserve.underlyingAsset,
        }
      })
      .flat()

    const sortedSupplyReserves = tokensToSupply.sort((a, b) =>
      +a.walletBalanceUSD > +b.walletBalanceUSD ? -1 : 1,
    )
    const filteredSupplyReserves = sortedSupplyReserves.filter(
      (reserve) => reserve.availableToDepositUSD !== "0",
    )

    // Filter out reserves
    const supplyReserves: unknown = showAll
      ? sortedSupplyReserves
      : filteredSupplyReserves.length >= 1
      ? filteredSupplyReserves
      : sortedSupplyReserves

    return supplyReserves as DashboardReserve[]
  }, [
    baseAssetSymbol,
    showAll,
    marketReferencePriceInUsd,
    reserves,
    user?.isInIsolationMode,
    user?.userReservesData,
    walletBalances,
  ])

  const isLoading = loadingReserves || loading

  return {
    data,
    isLoading,
  }
}
