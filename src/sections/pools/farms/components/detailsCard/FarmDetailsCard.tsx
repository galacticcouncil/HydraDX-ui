import { Tag } from "components/Tag/Tag"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { SIcon, SRow, SContainer } from "./FarmDetailsCard.styled"
import { FillBar } from "components/FillBar/FillBar"
import { scaleHuman } from "utils/balance"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { addSeconds } from "date-fns"
import ChevronRightIcon from "assets/icons/ChevronRight.svg?react"
import Distribution from "assets/icons/Distribution.svg?react"
import Hydrated from "assets/icons/Hydrated.svg?react"
import { Icon } from "components/Icon/Icon"
import { Farm, useFarmApr } from "api/farms"
import { useBestNumber } from "api/chain"
import { BLOCK_TIME, BN_0 } from "utils/constants"
import { useMemo } from "react"
import { getCurrentLoyaltyFactor } from "utils/farms/apr"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import {
  isXYKDeposit,
  TDepositData,
} from "sections/pools/farms/position/FarmingPosition.utils"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { useAssets } from "providers/assets"
import { TDeposit } from "api/deposits"

type FarmDetailsCardProps = {
  depositNft?: TDeposit
  depositData?: TDepositData
  farm: Farm
  onSelect?: () => void
  compact?: boolean
}

export const FarmDetailsCard = ({
  depositNft,
  depositData,
  farm,
  onSelect,
  compact,
}: FarmDetailsCardProps) => {
  const { t } = useTranslation()
  const { getAssetWithFallback } = useAssets()

  const asset = getAssetWithFallback(farm.globalFarm.rewardCurrency.toString())
  const apr = useFarmApr(farm)

  const { relaychainBlockNumber } = useBestNumber().data ?? {}

  const isClickable = !!onSelect

  const secondsDurationToEnd =
    relaychainBlockNumber != null
      ? apr.data?.estimatedEndBlock
          .minus(relaychainBlockNumber.toBigNumber())
          .times(BLOCK_TIME)
          .toNumber()
      : undefined

  const currentApr = useMemo(() => {
    if (depositNft && apr.data != null) {
      const depositYield = depositNft.data.yieldFarmEntries.find(
        (entry) =>
          entry.yieldFarmId.eq(farm.yieldFarm.id) &&
          entry.globalFarmId.eq(farm.globalFarm.id),
      )

      if (!depositYield) return BN_0
      if (!apr.data.loyaltyCurve) return apr.data.apr

      const currentLoyaltyFactor = getCurrentLoyaltyFactor(
        apr.data.loyaltyCurve,
        apr.data.currentPeriod.minus(depositYield?.enteredAt.toBigNumber()),
      )

      return apr.data.apr.times(currentLoyaltyFactor)
    }
    return BN_0
  }, [depositNft, farm.globalFarm.id, farm.yieldFarm.id, apr.data])

  if (apr.data == null) return null

  const fullness = apr.data.fullness
  const isFull = fullness.gte(100)

  return (
    <SContainer
      isClickable={isClickable}
      onClick={() => onSelect?.()}
      isJoined={!!depositNft}
    >
      <div
        sx={{
          flex: "column",
          justify: "space-between",
          gap: 12,
        }}
      >
        {depositNft && <Tag>{t("farms.details.card.tag.label")}</Tag>}
        <div
          sx={{
            flex: "row",
            align: "center",
            justify: "space-between",
          }}
          css={{ flex: 1 }}
        >
          <div sx={{ flex: "row", align: "center", gap: 6 }}>
            <Icon size={24} icon={<AssetLogo id={asset.id} />} />
            <Text fs={[18, 16]} font="GeistMedium">
              {asset.symbol}
            </Text>
          </div>
          <Text fs={18} lh={18} fw={400} css={{ whiteSpace: "nowrap" }}>
            {apr.data.minApr && apr.data?.apr.gt(0)
              ? t("value.upToAPR", {
                  maxApr: apr.data?.apr,
                })
              : t("value.APR", { apr: apr.data?.apr })}
          </Text>
        </div>
      </div>

      <div sx={{ flex: "column", flexGrow: 1, width: "100%" }}>
        <SRow compact={compact}>
          {compact ? (
            <Icon sx={{ color: "darkBlue200" }} icon={<Distribution />} />
          ) : (
            <FillBar
              percentage={apr.data.distributedRewards
                .div(apr.data.maxRewards)
                .times(100)
                .toNumber()}
            />
          )}

          <Text tAlign={compact ? "left" : "right"}>
            <Trans
              t={t}
              i18nKey="farms.details.card.distribution"
              tOptions={{
                distributed: scaleHuman(
                  apr.data.distributedRewards,
                  asset.decimals,
                ),
                max: scaleHuman(apr.data.potMaxRewards, asset.decimals),
              }}
            >
              <Text as="span" fs={14} color="basic100" />
              <Text as="span" fs={14} color="basic300" />
            </Trans>
          </Text>
        </SRow>
        <SRow compact={compact}>
          {compact ? (
            <Icon sx={{ color: "brightBlue200" }} icon={<Hydrated />} />
          ) : (
            <FillBar
              percentage={fullness.toNumber()}
              variant={isFull ? "full" : "secondary"}
            />
          )}

          <div
            sx={{ flex: "row", gap: 2, align: "center" }}
            css={{ justifySelf: compact ? "start" : "end" }}
          >
            <Text fs={14} color="basic100">
              {t("farms.details.card.capacity", {
                capacity: fullness,
              })}
            </Text>
            {isFull && (
              <InfoTooltip text={t("farms.details.card.capacity.desc")}>
                <SInfoIcon />
              </InfoTooltip>
            )}
          </div>
        </SRow>
        {depositData && (
          <>
            <SRow compact={compact}>
              <Text fs={14} lh={18}>
                {t("farms.details.card.locked.label")}
              </Text>
              <LockedValue depositData={depositData} />
            </SRow>

            <SRow compact={compact}>
              <Text fs={14} lh={18}>
                {t("farms.details.card.currentApr.label")}
              </Text>
              <GradientText
                fs={14}
                font="GeistMedium"
                gradient="pinkLightBlue"
                tAlign="right"
                sx={{ width: "fit-content" }}
                css={{ justifySelf: "end" }}
              >
                {t("value.APR", { apr: currentApr })}
              </GradientText>
            </SRow>
          </>
        )}
        <SRow compact={compact} sx={{ pb: 0, flex: "row" }}>
          <Text fs={12} lh={16} fw={400} color="basic500">
            {secondsDurationToEnd != null &&
              t("farms.details.card.end.value", {
                end: addSeconds(new Date(), secondsDurationToEnd),
              })}
          </Text>
        </SRow>
      </div>
      {onSelect && (
        <SIcon
          sx={{
            color: "brightBlue300",
            height: "100%",
            align: "center",
            pr: 3,
          }}
          icon={<ChevronRightIcon />}
        />
      )}
    </SContainer>
  )
}

const LockedValue = ({ depositData }: { depositData: TDepositData }) => {
  const { t } = useTranslation()

  return (
    <GradientText
      fs={14}
      tAlign="right"
      font="GeistMedium"
      gradient="pinkLightBlue"
      sx={{ width: "fit-content" }}
      css={{ justifySelf: "end" }}
    >
      {isXYKDeposit(depositData) ? (
        <>
          {t("value.tokenWithSymbol", {
            value: depositData.assetA.amount,
            symbol: depositData.assetA.symbol,
          })}{" "}
          |{" "}
          {t("value.tokenWithSymbol", {
            value: depositData.assetB.amount,
            symbol: depositData.assetB.symbol,
          })}
        </>
      ) : (
        t("value.tokenWithSymbol", {
          value: depositData.totalValueShifted,
          symbol: depositData.meta.symbol,
        })
      )}
    </GradientText>
  )
}
