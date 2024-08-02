import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { useFarmAprs, useFarms } from "api/farms"
import { getCurrentLoyaltyFactor } from "utils/farms/apr"
import { isNotNil } from "utils/helpers"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { usePoolData } from "sections/pools/pool/Pool"
import { TDeposit } from "api/deposits"

type JoinedFarmsProps = { depositNft: TDeposit }

export const JoinedFarms = ({ depositNft }: JoinedFarmsProps) => {
  const { t } = useTranslation()
  const {
    pool: { id: poolId },
  } = usePoolData()
  const farms = useFarms([poolId])

  const joinedFarms =
    farms.data?.filter((farm) => {
      return depositNft.data.yieldFarmEntries.some(
        (entry) =>
          entry.globalFarmId.eq(farm.globalFarm.id) &&
          entry.yieldFarmId.eq(farm.yieldFarm.id) &&
          entry.yieldFarmId.toString() === farm.yieldFarm.id.toString(),
      )
    }) ?? []

  const farmAprs = useFarmAprs(joinedFarms)

  const joinedFarmsAprs =
    farmAprs.data
      ?.map((farmApr) => {
        const joinedYieldFarm = depositNft.data.yieldFarmEntries.find(
          (nft) => nft.yieldFarmId.toString() === farmApr.yieldFarmId,
        )

        if (!joinedYieldFarm) return null

        const currentPeriodInFarm = farmApr.currentPeriod.minus(
          joinedYieldFarm.enteredAt.toBigNumber(),
        )

        const currentApr = farmApr.loyaltyCurve
          ? farmApr.apr.times(
              getCurrentLoyaltyFactor(
                farmApr.loyaltyCurve,
                currentPeriodInFarm,
              ),
            )
          : farmApr.apr

        return { currentApr, assetId: farmApr.assetId.toString() }
      })
      .filter(isNotNil) ?? []

  const aprs = joinedFarmsAprs.map(
    (joinedFarmsApr) => joinedFarmsApr.currentApr,
  )

  return (
    <div sx={{ flex: "column", gap: 6 }}>
      <Text fs={14} color="basic500">
        {t("farms.positions.labels.joinedFarms.title")}
      </Text>
      <div sx={{ flex: "row", gap: 4, align: "center" }}>
        <MultipleIcons
          size={22}
          icons={joinedFarmsAprs.map((joinedFarmsApr) => ({
            icon: (
              <AssetLogo
                key={joinedFarmsApr.assetId}
                id={joinedFarmsApr.assetId}
              />
            ),
          }))}
        />
        <Text fs={16} color="white">
          {aprs
            .map((apr) =>
              t("value.percentage", { value: apr, decimalPlaces: 1 }),
            )
            .join(" + ")}{" "}
          {t("apr")}
        </Text>
      </div>
    </div>
  )
}
