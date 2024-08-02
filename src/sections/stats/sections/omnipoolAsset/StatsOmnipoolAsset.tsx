import { SOmnipoolAssetContainer } from "./StatsOmnipoolAsset.styled"
import {
  MakeGenerics,
  Navigate,
  useLocation,
  useSearch,
} from "@tanstack/react-location"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { AssetStats } from "./stats/AssetStats"
import { LiquidityProvidersTableWrapper } from "./LiquidityProvidersTable/LiquidityProvidersTableWrapper"
import { Spacer } from "components/Spacer/Spacer"
import BN from "bignumber.js"
import Skeleton from "react-loading-skeleton"
import { useMedia } from "react-use"
import { theme } from "theme"
import { BN_0 } from "utils/constants"
import { RecentTradesTableWrapperData } from "sections/stats/components/RecentTradesTable/RecentTradesTableWrapper"
import { RecentTradesTableSkeleton } from "sections/stats/components/RecentTradesTable/skeleton/RecentTradesTableSkeleton"
import { ChartWrapper } from "sections/stats/components/ChartsWrapper/ChartsWrapper"
import { SStatsCardContainer } from "sections/stats/StatsPage.styled"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { useRpcProvider } from "providers/rpcProvider"
import { LiquidityProvidersTableSkeleton } from "sections/stats/sections/omnipoolAsset/LiquidityProvidersTable/skeleton/LiquidityProvidersTableSkeleton"
import { useOmnipoolAssetDetails } from "sections/stats/StatsPage.utils"
import { LINKS } from "utils/navigation"
import { useAssets } from "providers/assets"

type SearchGenerics = MakeGenerics<{
  Search: { id: number }
}>

const OmnipoolAssetHeader = ({
  loading,
  assetId,
  tvl,
}: {
  loading?: boolean
  assetId?: string
  tvl?: BN
}) => {
  const { t } = useTranslation()
  const { getAsset } = useAssets()
  const asset = assetId ? getAsset(assetId) : undefined
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const isLoading = loading

  return (
    <div
      sx={{
        flex: "row",
        align: "center",
        justify: "space-between",
        pb: [18, 40],
      }}
    >
      <div sx={{ flex: "row", gap: 16, align: "center" }}>
        {isLoading || !asset ? (
          <Skeleton
            width={isDesktop ? 38 : 30}
            height={isDesktop ? 38 : 30}
            circle
          />
        ) : (
          <MultipleAssetLogo size={[30, 38]} iconId={asset?.iconId} />
        )}

        <div>
          {isLoading || !asset ? (
            <>
              <Skeleton width={100} height={isDesktop ? 28 : 15} />
              <Skeleton width={150} height={isDesktop ? 13 : 12} />
            </>
          ) : (
            <>
              <Text fs={[15, 28]} font="GeistMono" color="white">
                {asset.symbol}
              </Text>
              <Text fs={[12, 13]} tTransform="uppercase" color="white">
                {asset.name}
              </Text>
            </>
          )}
        </div>
      </div>

      <div sx={{ flex: "column", align: "end" }}>
        {isLoading || !tvl ? (
          <Skeleton width={200} height={isDesktop ? 42 : 18} />
        ) : (
          <Text fs={[18, 42]}>{t("value.usd", { amount: tvl })}</Text>
        )}

        <Text fs={[12, 16]} color="brightBlue300">
          {t("totalValueLocked")}
        </Text>
      </div>
    </div>
  )
}

export const StatsOmnipoolAsset = () => {
  const search = useSearch<SearchGenerics>()
  const assetId = search.id?.toString() as string
  const location = useLocation()

  if (!assetId && location.current.pathname === LINKS.statsOmnipool) {
    return <Navigate to="/stats" />
  }

  return <StatsOmnipoolAssetData assetId={assetId} />
}

const StatsOmnipoolAssetData = ({ assetId }: { assetId: string }) => {
  const { isLoaded } = useRpcProvider()
  const overviewData = useOmnipoolAssetDetails("tvl")

  const omnipoolAsset = overviewData.data.find(
    (overview) => overview.id === assetId,
  )

  if (!omnipoolAsset || overviewData.isLoading || !isLoaded) {
    return <StatsOmnipoolAssetSkeleton />
  }

  if (!omnipoolAsset) {
    return <Navigate to="/stats" />
  }

  const omnipollTvl = overviewData.data.reduce(
    (acc, asset) => acc.plus(asset.tvl),
    BN_0,
  )

  return (
    <SOmnipoolAssetContainer>
      <OmnipoolAssetHeader assetId={assetId} tvl={omnipoolAsset.tvl} />
      <div sx={{ flex: ["column", "row"], gap: [12, 20] }}>
        <AssetStats
          data={{
            vlm: omnipoolAsset.volume,
            cap: omnipoolAsset.cap.multipliedBy(100),
            pol: omnipoolAsset.pol,
            share: omnipoolAsset.tvl.div(omnipollTvl).multipliedBy(100),
            assetId,
            fee: omnipoolAsset.fee,
          }}
          isLoadingFee={omnipoolAsset.isLoadingFee}
        />
        <SStatsCardContainer
          sx={{ width: "100%", height: [500, 570], pt: [60, 20] }}
          css={{ position: "relative" }}
        >
          <ChartWrapper assetId={omnipoolAsset.id} />
        </SStatsCardContainer>
      </div>
      <Spacer size={[24, 60]} />
      <LiquidityProvidersTableWrapper assetId={assetId} />
      <Spacer size={[24, 60]} />
      <RecentTradesTableWrapperData assetId={assetId} />
    </SOmnipoolAssetContainer>
  )
}

const StatsOmnipoolAssetSkeleton = () => {
  return (
    <SOmnipoolAssetContainer>
      <OmnipoolAssetHeader loading />
      <div sx={{ flex: ["column", "row"], gap: [12, 20] }}>
        <AssetStats loading />
        <SStatsCardContainer
          sx={{ width: "100%", height: [500, 570], pt: [60, 20] }}
          css={{ position: "relative" }}
        >
          <ChartWrapper />
        </SStatsCardContainer>
      </div>
      <Spacer size={[24, 60]} />
      <LiquidityProvidersTableSkeleton />
      <Spacer size={[24, 60]} />
      <RecentTradesTableSkeleton />
    </SOmnipoolAssetContainer>
  )
}
