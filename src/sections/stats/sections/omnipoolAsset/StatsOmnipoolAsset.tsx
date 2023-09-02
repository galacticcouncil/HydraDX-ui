import { ReactComponent as ChevronDownIcon } from "assets/icons/ChevronRight.svg"
import {
  BackButton,
  SOmnipoolAssetContainer,
} from "./StatsOmnipoolAsset.styled"
import {
  MakeGenerics,
  Navigate,
  useNavigate,
  useSearch,
} from "@tanstack/react-location"
import { Text } from "components/Typography/Text/Text"
import { Icon } from "components/Icon/Icon"
import { useAsset } from "api/asset"
import { useApiPromise } from "utils/api"
import { isApiLoaded } from "utils/helpers"
import { useOmnipoolOverviewData } from "sections/stats/sections/overview/data/OmnipoolOverview.utils"
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
import { AssetLogo } from "components/AssetIcon/AssetIcon"

type SearchGenerics = MakeGenerics<{
  Search: { asset: number }
}>

export const OmnipoolAssetNavigation = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div sx={{ flex: "row", gap: 10, align: "center" }}>
      <BackButton
        name="Expand"
        icon={<ChevronDownIcon />}
        onClick={() => navigate({ to: "" })}
        size={24}
      />
      <Text fs={13} tTransform="uppercase" color="white">
        {t("stats.omnipool.navigation.back")}
      </Text>
    </div>
  )
}

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
  const asset = useAsset(loading ? undefined : assetId)
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const isLoading = loading || asset.isLoading

  return (
    <div
      sx={{
        flex: "row",
        align: "center",
        justify: "space-between",
        py: [18, 40],
      }}
    >
      <div sx={{ flex: "row", gap: 16, align: "center" }}>
        {isLoading || !asset.data ? (
          <Skeleton
            width={isDesktop ? 38 : 30}
            height={isDesktop ? 38 : 30}
            circle
          />
        ) : (
          <Icon size={[30, 38]} icon={<AssetLogo id={asset.data.id} />} />
        )}

        <div>
          {isLoading || !asset.data ? (
            <>
              <Skeleton width={100} height={isDesktop ? 28 : 15} />
              <Skeleton width={150} height={isDesktop ? 13 : 12} />
            </>
          ) : (
            <>
              <Text fs={[15, 28]} font="FontOver" color="white">
                {asset.data.symbol}
              </Text>
              <Text fs={[12, 13]} tTransform="uppercase" color="white">
                {asset.data.name}
              </Text>
            </>
          )}
        </div>
      </div>

      <div sx={{ flex: "column", align: "end" }}>
        {isLoading || !tvl ? (
          <Skeleton width={200} height={isDesktop ? 42 : 18} />
        ) : (
          <Text fs={[18, 42]} font="FontOver">
            {t("value.usd", { amount: tvl })}
          </Text>
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
  const assetId = search.asset?.toString()

  if (!assetId) {
    return <Navigate to="/stats" />
  }

  return <StatsOmnipoolAssetData assetId={assetId} />
}

const StatsOmnipoolAssetData = ({ assetId }: { assetId: string }) => {
  const api = useApiPromise()
  const overviewData = useOmnipoolOverviewData()

  const omnipoolAsset = overviewData.data.find(
    (overview) => overview.id === assetId,
  )

  if (!omnipoolAsset || overviewData.isLoading || !isApiLoaded(api)) {
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
      <div sx={{ flex: ["column", "row"], gap: 20, mb: 20 }}>
        <AssetStats
          data={{
            vlm: omnipoolAsset.volume,
            cap: omnipoolAsset.cap.multipliedBy(100),
            pol: omnipoolAsset.pol,
            share: omnipoolAsset.tvl.div(omnipollTvl).multipliedBy(100),
          }}
        />
        <SStatsCardContainer
          sx={{ width: "100%", height: [500, 600], pt: [60, 20] }}
          css={{ position: "relative" }}
        >
          <ChartWrapper assetSymbol={omnipoolAsset.symbol} />
        </SStatsCardContainer>
      </div>
      <LiquidityProvidersTableWrapper />
      <Spacer size={[24, 60]} />
      <RecentTradesTableWrapperData assetId={assetId} />
    </SOmnipoolAssetContainer>
  )
}

const StatsOmnipoolAssetSkeleton = () => {
  return (
    <SOmnipoolAssetContainer>
      <OmnipoolAssetNavigation />
      <OmnipoolAssetHeader loading />
      <div sx={{ flex: ["column", "row"], gap: 20, mb: 20 }}>
        <AssetStats loading />
        <SStatsCardContainer
          sx={{ width: "100%", height: [500, 600] }}
          css={{ position: "relative" }}
        >
          <ChartWrapper />
        </SStatsCardContainer>
      </div>

      <LiquidityProvidersTableWrapper />
      <Spacer size={[24, 60]} />
      <RecentTradesTableSkeleton />
    </SOmnipoolAssetContainer>
  )
}
