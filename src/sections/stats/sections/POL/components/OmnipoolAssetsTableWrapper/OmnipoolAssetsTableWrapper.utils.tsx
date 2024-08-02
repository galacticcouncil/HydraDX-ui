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

export const useOmnipoolAssetsColumns = (): OmnipoolAssetsTableColumn[] => {
  const { accessor, display } =
    createColumnHelper<TUseOmnipoolAssetDetailsData[number]>()
  const { t } = useTranslation()

  return [
    accessor("symbol", {
      id: "symbol",
      header: t("stats.pol.table.assets.header.asset"),
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
            <Text fs={[14, 16]} color="white">
              {row.original.symbol}
            </Text>
            <Text
              fs={12}
              css={{ color: `rgba(${theme.rgbColors.whiteish500}, 0.61)` }}
              sx={{ display: ["inherit", "none"] }}
            >
              {row.original.name}
            </Text>
          </div>
        </div>
      ),
    }),
    accessor("pol", {
      id: "treasury",
      header: t("stats.pol.table.assets.header.pol"),
      sortingFn: (a, b) => (a.original.pol.gt(b.original.pol) ? 1 : -1),
      cell: ({ row }) => (
        <Text tAlign={["right", "left"]} color="white" fs={[13, 16]}>
          <DisplayValue value={row.original.pol} isUSD />
        </Text>
      ),
    }),
    accessor("volume", {
      id: "volume",
      header: t("stats.pol.table.assets.header.volume"),
      sortingFn: (a, b) =>
        a.original.volumePol.gt(b.original.volumePol) ? 1 : -1,
      cell: ({ row }) => (
        <Text color="white">
          <DisplayValue value={row.original.volumePol} isUSD />
        </Text>
      ),
    }),
    display({
      id: "actions",
      cell: () => (
        <div>
          <ButtonTransparent css={{ color: theme.colors.iconGray }}>
            <ChevronRightIcon />
          </ButtonTransparent>
        </div>
      ),
    }),
  ]
}
