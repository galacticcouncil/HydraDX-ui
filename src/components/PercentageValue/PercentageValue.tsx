import { FC } from "react"
import { useTranslation } from "react-i18next"

export type PercentageValueProps = {
  value: number
  minThreshold?: number
}

export const PercentageValue: FC<PercentageValueProps> = ({
  value,
  minThreshold = 0.01,
}) => {
  const { t } = useTranslation()
  const belowThreshold = Math.abs(value) < minThreshold
  return (
    <>
      {belowThreshold && <span sx={{ color: "basic300" }}>{"<"}</span>}
      {t("value.percentage", {
        value: belowThreshold ? minThreshold : value,
      })}
    </>
  )
}
