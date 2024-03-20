import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers"
import { createColumnHelper } from "@tanstack/react-table"
import { Button } from "components/Button/Button"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Switch } from "components/Switch/Switch"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { getAssetCapData } from "sections/lending/hooks/useAssetCaps"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { fetchIconSymbolAndName } from "sections/lending/ui-config/reservePatches"
import { AssetNameColumn } from "sections/lending/ui/columns/AssetNameColumn"
import { IncentivesCard } from "sections/lending/ui/incentives/IncentivesCard"
import { IsolatedEnabledBadge } from "sections/lending/ui/isolation-mode/IsolationBadge"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { theme } from "theme"

export type TSuppliedAssetsTable = typeof useSuppliedAssetsTableData
export type TSuppliedAssetsTableData = ReturnType<TSuppliedAssetsTable>
export type TSuppliedAssetsRow = TSuppliedAssetsTableData["data"][number]

const { accessor, display } = createColumnHelper<TSuppliedAssetsRow>()

export const useSuppliedAssetsTableColumns = () => {
  const { t } = useTranslation()
  const { user } = useAppDataContext()

  const { openWithdraw, openCollateralChange } = useModalContext()

  const isDesktop = useMedia(theme.viewport.gte.sm)

  return useMemo(
    () => [
      accessor(({ reserve }) => reserve.symbol, {
        header: t("lending.asset"),
        cell: ({ row }) => (
          <AssetNameColumn
            detailsAddress={row.original.underlyingAsset}
            symbol={row.original.reserve.symbol}
            iconSymbol={row.original.reserve.iconSymbol}
          />
        ),
      }),
      accessor("underlyingBalanceUSD", {
        header: t("lending.balance"),
        sortingFn: (a, b) =>
          Number(a.original.underlyingBalanceUSD) -
          Number(b.original.underlyingBalanceUSD),
        cell: ({ row }) => {
          const { underlyingBalanceUSD, underlyingBalance } = row.original
          const value = Number(underlyingBalance)
          const valueUsd = Number(underlyingBalanceUSD)
          const disabled = value === 0
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
          const { supplyAPY, reserve } = row.original

          return (
            <IncentivesCard
              value={supplyAPY}
              incentives={reserve.aIncentivesData}
              symbol={reserve.symbol}
            />
          )
        },
      }),
      accessor("usageAsCollateralEnabledOnUser", {
        header: t("lending.collateral"),
        meta: {
          sx: {
            textAlign: "center",
          },
        },
        cell: ({ row }) => {
          const { usageAsCollateralEnabledOnUser, underlyingAsset, reserve } =
            row.original

          const { isPaused, isIsolated } = reserve

          const { debtCeiling } = getAssetCapData(reserve)

          const canBeEnabledAsCollateral =
            !debtCeiling.isMaxed &&
            reserve.reserveLiquidationThreshold !== "0" &&
            ((!reserve.isIsolated && !user.isInIsolationMode) ||
              user.isolatedReserve?.underlyingAsset ===
                reserve.underlyingAsset ||
              (reserve.isIsolated &&
                user.totalCollateralMarketReferenceCurrency === "0"))

          const isEnabled =
            usageAsCollateralEnabledOnUser && canBeEnabledAsCollateral
          return (
            <span
              sx={{ flex: "column", align: ["end", "center"], gap: [10, 4] }}
            >
              <Switch
                value={isEnabled}
                disabled={isPaused || !canBeEnabledAsCollateral}
                onCheckedChange={() => openCollateralChange(underlyingAsset)}
                size={isDesktop ? "small" : "medium"}
                label=""
                name={`collateral-switch-${underlyingAsset}`}
              />
              {isIsolated && <IsolatedEnabledBadge />}
            </span>
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
          const { reserve, underlyingAsset } = row.original

          const { isActive, isPaused } = reserve

          const disableWithdraw = !isActive || isPaused
          return (
            <Button
              disabled={disableWithdraw}
              onClick={() => openWithdraw(underlyingAsset)}
              size="micro"
              sx={{ height: 27 }}
            >
              {t("lending.withdraw")}
            </Button>
          )
        },
      }),
    ],
    [
      isDesktop,
      openCollateralChange,
      openWithdraw,
      t,
      user.isInIsolationMode,
      user.isolatedReserve?.underlyingAsset,
      user.totalCollateralMarketReferenceCurrency,
    ],
  )
}

export const useSuppliedAssetsTableData = () => {
  const { user, loading } = useAppDataContext()
  const { currentNetworkConfig } = useProtocolDataContext()

  const { account } = useAccount()

  const data = useMemo(() => {
    if (!account) return []
    return (
      user?.userReservesData
        .filter((userReserve) => userReserve.underlyingBalance !== "0")
        .map((userReserve) => ({
          ...userReserve,
          supplyAPY: userReserve.reserve.supplyAPY, // Note: added only for table sort
          reserve: {
            ...userReserve.reserve,
            ...(userReserve.reserve.isWrappedBaseAsset
              ? fetchIconSymbolAndName({
                  symbol: currentNetworkConfig.baseAssetSymbol,
                  underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
                })
              : {}),
          },
        })) || []
    )
  }, [account, currentNetworkConfig.baseAssetSymbol, user?.userReservesData])

  return {
    data,
    isLoading: loading,
  }
}
