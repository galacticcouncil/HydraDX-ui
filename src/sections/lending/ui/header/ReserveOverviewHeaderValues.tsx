import { DataValue, DataValueList } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useMedia } from "react-use"
import { PercentageValue } from "components/PercentageValue"
import {
  ComputedReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { theme } from "theme"

export type ReserveOverviewHeaderValuesProps = {
  className?: string
  underlyingAsset: string
}

export const ReserveOverviewHeaderValues: FC<
  ReserveOverviewHeaderValuesProps
> = ({ underlyingAsset, className }) => {
  const { reserves, loading } = useAppDataContext()

  const isDesktop = useMedia(theme.viewport.gte.sm)

  const poolReserve = reserves.find(
    (reserve) => reserve.underlyingAsset === underlyingAsset,
  ) as ComputedReserveData

  return (
    <div
      sx={{
        flex: ["column", "row"],
        align: ["start", "center"],
        gap: [20, 40],
      }}
      className={className}
    >
      <div sx={{ flex: "row", gap: 8, align: "center" }}>
        <div>
          <img
            src={`https://app.aave.com/icons/tokens/${poolReserve.iconSymbol.toLowerCase()}.svg`}
            sx={{ width: 32, height: 32 }}
            alt=""
          />
        </div>
        <div>
          <Text fs={18} lh={24} font="ChakraPetchBold">
            {poolReserve.symbol}
          </Text>
          <Text fs={14} lh={18}>
            {poolReserve.name}
          </Text>
        </div>
      </div>
      <DataValueList separated={!isDesktop} sx={{ width: ["100%", "auto"] }}>
        <DataValue
          size="medium"
          isLoading={loading}
          labelColor="brightBlue300"
          label="Reserve size"
        >
          <DisplayValue
            isUSD
            compact
            value={Math.max(Number(poolReserve?.totalLiquidityUSD), 0)}
          />
        </DataValue>
        <DataValue
          size="medium"
          isLoading={loading}
          labelColor="brightBlue300"
          label="Available liquidity"
        >
          <DisplayValue
            isUSD
            compact
            value={Math.max(Number(poolReserve?.availableLiquidityUSD), 0)}
          />
        </DataValue>
        <DataValue
          size="medium"
          isLoading={loading}
          labelColor="brightBlue300"
          label="Utilization rate"
        >
          <PercentageValue
            value={Number(poolReserve?.borrowUsageRatio ?? 0) * 100}
          />
        </DataValue>
        <DataValue
          size="medium"
          isLoading={loading}
          labelColor="brightBlue300"
          label="Oracle price"
        >
          <DisplayValue isUSD value={Number(poolReserve?.priceInUSD ?? 0)} />
        </DataValue>
      </DataValueList>
    </div>
  )
}
