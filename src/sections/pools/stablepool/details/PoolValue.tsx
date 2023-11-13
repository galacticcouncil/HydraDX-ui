import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { DollarAssetValue } from "components/DollarAssetValue/DollarAssetValue"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import Skeleton from "react-loading-skeleton"
import { BN_NAN } from "utils/constants"
import { SInfoIcon } from "sections/pools/pool/Pool.styled"
import { Stablepool } from "sections/pools/PoolsPage.utils"
import { useVolume } from "api/volume"

type PoolValueProps = {
  pool: Stablepool
  className?: string
}

export const PoolValue = ({ pool, className }: PoolValueProps) => {
  const { t } = useTranslation()

  const { data, isLoading } = useVolume(pool.id.toString())

  const { total, totalDisplay } = pool

  const percentInOmnipool = totalDisplay
    .dividedBy(total.value)
    .multipliedBy(100)

  return (
    <div sx={{ flex: "column", justify: "end" }} className={className}>
      <div sx={{ flex: "row", justify: "space-between" }}>
        <div sx={{ flex: "column", gap: 10 }}>
          <Text fs={13} color="basic400">
            {t("liquidity.stablepool.asset.details.total")}
          </Text>
          <div
            sx={{
              flex: "column",
              align: "start",
              justify: "center",
              gap: 4,
            }}
          >
            <Text lh={22} color="white" fs={18}>
              <DisplayValue value={total.value} />
            </Text>
            <Text fs={13} color="basic500">
              {t("liquidity.asset.details.percent", {
                value: percentInOmnipool,
              })}
            </Text>
          </div>
        </div>
        <div sx={{ flex: "column", gap: 10, width: ["auto", 118] }}>
          <div sx={{ flex: "row", align: "center", gap: 6 }}>
            <Text fs={13} color="basic400">
              {t("liquidity.asset.details.24hours")}
            </Text>
            <InfoTooltip text={t("liquidity.asset.details.24hours.tooltip")}>
              <SInfoIcon />
            </InfoTooltip>
          </div>
          {isLoading ? (
            <Skeleton />
          ) : (
            <DollarAssetValue
              value={data?.volume ?? BN_NAN}
              wrapper={(children) => (
                <Text fs={18} lh={22} color="white" tAlign={["right", "left"]}>
                  {children}
                </Text>
              )}
            >
              {t("value.usd", { amount: data?.volume })}
            </DollarAssetValue>
          )}
        </div>
      </div>
    </div>
  )
}