import BN from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import Skeleton from "react-loading-skeleton"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useTranslation } from "react-i18next"

type PieTotalValueProps = {
  title: string
  data?: BN
  isLoading: boolean
  compact?: boolean
  percentage?: boolean
}

export const TotalValue = ({
  title,
  data,
  isLoading,
  compact,
  percentage,
}: PieTotalValueProps) => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <div sx={{ flex: "column", gap: 8 }}>
      <Text color="brightBlue300">{title}</Text>
      {isLoading ? (
        <Skeleton width={200} height={isDesktop ? 42 : 20} />
      ) : (
        <div sx={{ flex: "row", align: "baseline", gap: 4 }}>
          <Text fs={[20, 42]} font="FontOver">
            {t(
              compact
                ? "value.compact"
                : percentage
                ? "value.percentage"
                : "value",
              { value: data },
            )}
          </Text>
        </div>
      )}
    </div>
  )
}
