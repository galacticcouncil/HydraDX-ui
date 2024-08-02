import { MakeGenerics, useSearch } from "@tanstack/react-location"
import { isPoolUpdateEvent, useLBPPoolEvents, useLbpPool } from "api/bonds"
import { Text } from "components/Typography/Text/Text"
import { customFormatDuration, formatDate } from "utils/formatting"
import ClockIcon from "assets/icons/ClockIcon.svg?react"
import { Icon } from "components/Icon/Icon"
import { Trans, useTranslation } from "react-i18next"
import { BondProgreesBar } from "./components/BondProgressBar/BondProgressBar"
import { useMemo, useState } from "react"
import { BLOCK_TIME } from "utils/constants"
import { useBestNumber } from "api/chain"
import Skeleton from "react-loading-skeleton"
import { BondInfoCards } from "./components/BondInfoCards/BondInfoCards"
import { MyActiveBonds } from "sections/trade/sections/bonds/MyActiveBonds"
import { BondDetailsSkeleton } from "./BondDetailsSkeleton"
import { BondsTrade } from "./components/BondTrade/BondsTradeApp"
import { addSeconds } from "date-fns"
import { theme } from "theme"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { useAssets } from "providers/assets"

type SearchGenerics = MakeGenerics<{
  Search: { assetOut: number; assetIn: number }
}>

export const BondsDetailsHeaderSkeleton = () => {
  return (
    <div
      sx={{
        flex: ["column", "row"],
        justify: "space-between",
        align: "center",
        gap: [20, 0],
        mt: ["-55px", 0],
      }}
    >
      <Skeleton width={200} height={26} />
      <div sx={{ flex: "row", align: "center", gap: 4 }}>
        <Icon sx={{ color: "brightBlue300" }} icon={<ClockIcon />} />

        <Skeleton width={150} height={22} />
      </div>
    </div>
  )
}

export const BondDetailsHeader = ({
  title,
  end,
  accumulatedAssetId,
}: {
  title: string
  end?: number
  accumulatedAssetId?: number
}) => {
  const { t } = useTranslation()
  const { getAsset } = useAssets()

  const bestNumber = useBestNumber()
  const accumulatedAssetMeta = getAsset(String(accumulatedAssetId))

  const isLoading = bestNumber.isLoading

  if (isLoading || !bestNumber.data || !accumulatedAssetMeta)
    return <BondsDetailsHeaderSkeleton />

  let endingDuration
  let date

  if (end && !isLoading) {
    const remainingSeconds = BLOCK_TIME.multipliedBy(
      end - bestNumber.data?.relaychainBlockNumber.toNumber() ?? 0,
    ).toNumber()

    endingDuration = customFormatDuration({ end: remainingSeconds * 1000 })

    date = addSeconds(new Date(), remainingSeconds)
  }

  const isPast = bestNumber.data?.relaychainBlockNumber.toNumber() > (end ?? 0)

  return (
    <div
      sx={{
        flex: ["column", "row"],
        justify: "space-between",
        align: "center",
        gap: [20, 0],
        mt: ["-55px", 0],
      }}
    >
      <div sx={{ flex: "column", align: ["center", "flex-start"] }}>
        <Text fs={[15, 24]} color="white" font="GeistMono">
          {title}
        </Text>
        {accumulatedAssetId && (
          <div sx={{ flex: "row", gap: 4 }}>
            <Text
              fs={[13, 16]}
              css={{ color: `rgba(${theme.rgbColors.white}, 0.7)` }}
            >
              {t("bonds.details.header.accumulatedAsset")}
            </Text>
            <Icon size={16} icon={<AssetLogo id={accumulatedAssetMeta.id} />} />
            <Text
              fs={[13, 16]}
              css={{ color: `rgba(${theme.rgbColors.white}, 0.7)` }}
            >
              {accumulatedAssetMeta.symbol}
            </Text>
          </div>
        )}
      </div>

      <div sx={{ flex: "row", align: "center", gap: 4 }}>
        <Icon sx={{ color: "brightBlue300" }} icon={<ClockIcon />} />
        {endingDuration ? (
          <Text fs={20} color="white" font="GeistSemiBold">
            <Trans
              t={t}
              i18nKey={`bonds.details.header.${isPast ? "endPast" : "end"}`}
              tOptions={{
                date:
                  isPast && date
                    ? formatDate(date, "dd/MM/yyyy HH:mm")
                    : endingDuration.duration,
              }}
            >
              <span sx={{ color: "brightBlue300", fontSize: 20 }} />
            </Trans>
          </Text>
        ) : (
          <Skeleton width={150} height={22} />
        )}
      </div>
    </div>
  )
}

export const BondDetailsData = () => {
  const { getBond, getAsset } = useAssets()
  const search = useSearch<SearchGenerics>()
  const bestNumber = useBestNumber()

  const [bondId, setBondId] = useState(() => {
    const assetOutId = search.assetOut?.toString()
    const assetInId = search.assetIn?.toString()
    const isBond = assetOutId ? getAsset(assetOutId)?.isBond : undefined

    if (isBond) {
      return assetOutId
    } else {
      return assetInId
    }
  })

  const bond = bondId ? getBond(bondId) : undefined

  const lbpPool = useLbpPool({ id: bond?.id })
  const poolData = lbpPool.data?.[0]

  let isPast: boolean | undefined = lbpPool.isLoading ? undefined : !poolData

  if (poolData && bestNumber.data) {
    isPast =
      bestNumber.data?.relaychainBlockNumber.toNumber() > (poolData.end ?? 0)
  }

  const lbpPoolEvents = useLBPPoolEvents(isPast === true ? bond?.id : undefined)

  const lbpPoolData = useMemo(() => {
    if (lbpPool.data)
      return {
        data: lbpPool.data[0],
        poolId: undefined,
        removeBlock: undefined,
      }

    if (lbpPoolEvents.data?.events.length) {
      const lbpPoolData = lbpPoolEvents.data.events
        .filter(isPoolUpdateEvent)
        .reverse()?.[0]

      const lbpPoolRemoved = lbpPoolEvents.data.events.find(
        (event) => event.name === "LBP.LiquidityRemoved",
      )

      return {
        data: lbpPoolData.args.data,
        poolId: lbpPoolData.args.pool,
        removeBlock: lbpPoolRemoved?.block.height,
      }
    }

    return undefined
  }, [lbpPool.data, lbpPoolEvents.data?.events])

  if (!bond || lbpPool.isLoading) return <BondDetailsSkeleton />

  return (
    <div sx={{ flex: "column", gap: [20, 40] }}>
      <BondDetailsHeader
        title={bond.name}
        accumulatedAssetId={lbpPoolData?.data.assets.find(
          (asset: number) => asset !== Number(bond?.id),
        )}
        end={lbpPoolData?.data.end}
      />

      <BondsTrade bondId={bondId} setBondId={setBondId} />

      <BondProgreesBar bondId={bond?.id} decimals={bond.decimals} />

      <BondInfoCards
        bond={bond}
        lbpPool={lbpPoolData?.data}
        poolId={lbpPoolData?.poolId}
        removeBlock={lbpPoolData?.removeBlock}
        isPast={isPast}
      />

      <MyActiveBonds id={bond.id} showTransactions />
    </div>
  )
}
