import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { ButtonTransparent } from "components/Button/Button"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import ChevronRightIcon from "assets/icons/ChevronRight.svg?react"
import { TUseOmnipoolAssetDetailsData } from "sections/stats/StatsPage.utils"
import { OmnipoolAssetsTableColumn } from "sections/stats/components/OmnipoolAssetsTable/OmnipoolAssetsTable.utils"
import { useMedia } from "react-use"
import { CellSkeleton } from "components/Skeleton/CellSkeleton"
import { Farm, getMinAndMaxAPR, useFarmAprs, useFarms } from "api/farms"
import { useMemo } from "react"
import { BN_0 } from "utils/constants"
import BigNumber from "bignumber.js"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { useAssets } from "providers/assets"

const APYFarming = ({ farms, apy }: { farms: Farm[]; apy: number }) => {
  const { t } = useTranslation()

  const farmAprs = useFarmAprs(farms)

  const percentage = useMemo(() => {
    if (farmAprs.data?.length) {
      return getMinAndMaxAPR(farmAprs)
    }

    return {
      minApr: BN_0,
      maxApr: BN_0,
    }
  }, [farmAprs])

  const isLoading = farmAprs.isInitialLoading

  if (isLoading) return <CellSkeleton />

  return (
    <Text color="white" fs={14}>
      {percentage.maxApr.gt(0)
        ? t("value.percentage.range", {
            from: percentage.minApr.lt(apy)
              ? percentage.minApr
              : BigNumber(apy),
            to: percentage.maxApr.plus(apy),
          })
        : t("value.percentage", { value: BigNumber(apy) })}
    </Text>
  )
}

const APY = ({
  assetId,
  fee,
  isLoading,
}: {
  assetId: string
  fee: BigNumber
  isLoading: boolean
}) => {
  const { t } = useTranslation()
  const { native } = useAssets()
  const farms = useFarms([assetId])

  if (isLoading || farms.isLoading) return <CellSkeleton />

  if (farms.data?.length)
    return <APYFarming farms={farms.data} apy={fee.toNumber()} />

  return (
    <Text color="white" fs={14}>
      {assetId === native.id ? "--" : t("value.percentage", { value: fee })}
    </Text>
  )
}

export const useOmnipoolAssetsColumns = (): OmnipoolAssetsTableColumn[] => {
  const { accessor, display } =
    createColumnHelper<TUseOmnipoolAssetDetailsData[number]>()
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return [
    accessor("symbol", {
      id: "symbol",
      header: t("stats.overview.table.assets.header.asset"),
      sortingFn: (a, b) => a.original.symbol.localeCompare(b.original.symbol),
      cell: ({ row }) => (
        <div
          sx={{
            flex: "row",
            gap: 8,
            align: "center",
            justify: "start",
          }}
        >
          <MultipleAssetLogo size={[26, 30]} iconId={row.original.iconIds} />

          <div sx={{ flex: "column" }}>
            <Text fs={14} color="white" fw={600}>
              {row.original.symbol}
            </Text>
            {isDesktop && (
              <Text
                fs={12}
                css={{ color: `rgba(${theme.rgbColors.whiteish500}, 0.61)` }}
                sx={{ display: ["inherit", "none"] }}
              >
                {row.original.name}
              </Text>
            )}
          </div>
        </div>
      ),
    }),
    accessor("tvl", {
      id: "tvl",
      header: t("stats.overview.table.assets.header.tvl"),
      sortingFn: (a, b) => (a.original.tvl.gt(b.original.tvl) ? 1 : -1),
      cell: ({ row }) => (
        <Text tAlign={isDesktop ? "left" : "right"} color="white" fs={14}>
          <DisplayValue value={row.original.tvl} isUSD />
        </Text>
      ),
    }),
    accessor("volume", {
      id: "volume",
      header: t("stats.overview.table.assets.header.volume"),
      sortingFn: (a, b) => (a.original.volume.gt(b.original.volume) ? 1 : -1),
      cell: ({ row }) => {
        if (row.original.isLoadingVolume) {
          return <CellSkeleton />
        }
        return (
          <Text color="white" fs={14}>
            <DisplayValue value={row.original.volume} isUSD />
          </Text>
        )
      },
    }),
    display({
      id: "apy",
      //@ts-ignore
      header: (
        <div sx={{ flex: "row", align: "center", gap: 4 }}>
          {t("stats.overview.table.assets.header.apy")}
          <InfoTooltip text={t("stats.overview.table.assets.header.apy.desc")}>
            <SInfoIcon />
          </InfoTooltip>
        </div>
      ),
      cell: ({ row }) => (
        <APY
          assetId={row.original.id}
          fee={row.original.fee}
          isLoading={row.original.isLoadingFee}
        />
      ),
    }),
    accessor("price", {
      id: "price",
      header: t("stats.overview.table.assets.header.price"),
      sortingFn: (a, b) => (a.original.price.gt(b.original.price) ? 1 : -1),
      cell: ({ row }) => (
        <Text color="white" fs={14}>
          {t("value.token", {
            value: row.original.price,
            decimalPlaces: 4,
            numberPrefix: "$",
          })}
        </Text>
      ),
    }),
    display({
      id: "actions",
      cell: () => (
        <div>
          <ButtonTransparent sx={{ color: "darkBlue300" }}>
            <ChevronRightIcon />
          </ButtonTransparent>
        </div>
      ),
    }),
  ]
}
