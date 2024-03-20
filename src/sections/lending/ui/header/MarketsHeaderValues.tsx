import { valueToBigNumber } from "@aave/math-utils"
import { DataValue, DataValueList } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { FC } from "react"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"

export const MarketsHeaderValues: FC<{
  className?: string
}> = ({ className }) => {
  const { reserves, loading } = useAppDataContext()

  const aggregatedStats = reserves.reduce(
    (acc, reserve) => {
      return {
        totalLiquidity: acc.totalLiquidity.plus(reserve.totalLiquidityUSD),
        totalDebt: acc.totalDebt.plus(reserve.totalDebtUSD),
      }
    },
    {
      totalLiquidity: valueToBigNumber(0),
      totalDebt: valueToBigNumber(0),
    },
  )

  return (
    <DataValueList
      separated
      className={className}
      sx={{ maxWidth: ["100%", 700] }}
    >
      <DataValue
        size="large"
        isLoading={loading}
        labelColor="brightBlue300"
        label="Total market size"
      >
        <DisplayValue isUSD compact value={aggregatedStats.totalLiquidity} />
      </DataValue>
      <DataValue
        size="large"
        isLoading={loading}
        labelColor="brightBlue300"
        label="Total available"
      >
        <DisplayValue
          isUSD
          compact
          value={aggregatedStats.totalLiquidity.minus(
            aggregatedStats.totalDebt,
          )}
        />
      </DataValue>
      <DataValue
        size="large"
        isLoading={loading}
        labelColor="brightBlue300"
        label="Total borrows"
      >
        <DisplayValue isUSD compact value={aggregatedStats.totalDebt} />
      </DataValue>
    </DataValueList>
  )
}
