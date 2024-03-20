import { Skeleton } from "@mui/material"
import React from "react"
import { useTranslation } from "react-i18next"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"

type HollarBorrowApyRangeProps = {
  minVal?: number
  maxVal?: number
}
/**
 * This component displays two borrow APY values as percentages with two decimal places and a hyphen in between.
 * This component can take in optional range values and display variants for typography of the percentage values and the hyphen.
 * If no range values are provided, which would usually be APY values related to different user balances, then the default values are variable borrow APY with no discount as maximum range value and with the max discount as the minimum range value.
 */
export const HollarBorrowApyRange: React.FC<HollarBorrowApyRangeProps> = ({
  minVal,
  maxVal,
}) => {
  const { t } = useTranslation()
  const { ghoLoadingData, ghoReserveData } = useAppDataContext()

  if (ghoLoadingData) return <Skeleton width={70} height={24} />

  // Check precision, could be different by small amount but show same
  const lowRangeValue = minVal ?? ghoReserveData.ghoBorrowAPYWithMaxDiscount
  const highRangeValue = maxVal ?? ghoReserveData.ghoVariableBorrowAPY

  // Normalize and compare, round to two decimal places as if they'd be formatted
  const normalizedLowValue = Number((lowRangeValue * 100).toFixed(2))
  const normalizedHighValue = Number((highRangeValue * 100).toFixed(2))
  const isSameDisplayValue = normalizedLowValue === normalizedHighValue

  // Just show one value if they are the same display value after being formatted, otherwise, hyphenate and show both values
  return (
    <>
      {isSameDisplayValue
        ? t("value.percentage", { value: +lowRangeValue * 100 })
        : t("value.percentage.range", {
            from: +lowRangeValue * 100,
            to: +highRangeValue * 100,
          })}
    </>
  )
}
