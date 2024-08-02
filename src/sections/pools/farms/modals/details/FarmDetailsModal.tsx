import { Farm } from "api/farms"
import { Text } from "components/Typography/Text/Text"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { FarmDetailsCard } from "sections/pools/farms/components/detailsCard/FarmDetailsCard"
import { LoyaltyGraph } from "sections/pools/farms/components/loyaltyGraph/LoyaltyGraph"
import { SLoyaltyRewardsContainer } from "./FarmDetailsModal.styled"
import { FarmDetailsModalValues } from "./FarmDetailsModalValues"
import { TDeposit } from "api/deposits"
import { TDepositData } from "sections/pools/farms/position/FarmingPosition.utils"

type FarmDetailsModalProps = {
  farm: Farm
  depositNft?: TDeposit
  depositData?: TDepositData
  currentBlock?: number
}

export const FarmDetailsModal = ({
  farm,
  depositNft,
  depositData,
  currentBlock,
}: FarmDetailsModalProps) => {
  const { t } = useTranslation()

  const loyaltyCurve = farm.yieldFarm.loyaltyCurve.unwrapOr(null)

  const enteredBlock = depositNft?.data.yieldFarmEntries
    .find(
      (entry) =>
        entry.yieldFarmId.eq(farm.yieldFarm.id) &&
        entry.globalFarmId.eq(farm.globalFarm.id),
    )
    ?.enteredAt.toBigNumber()

  const currentBlockRef = useRef<number | undefined>(currentBlock)

  return (
    <>
      <FarmDetailsCard depositNft={depositNft} farm={farm} />

      {loyaltyCurve && currentBlockRef.current && (
        <SLoyaltyRewardsContainer>
          <Text
            fs={19}
            sx={{ mb: 30 }}
            font="GeistMono"
            color="basic100"
            tTransform="uppercase"
          >
            {t("farms.modal.details.loyaltyRewards.label")}
          </Text>

          <LoyaltyGraph
            farm={farm}
            loyaltyCurve={loyaltyCurve}
            enteredAt={enteredBlock}
            currentBlock={currentBlockRef.current}
          />
        </SLoyaltyRewardsContainer>
      )}

      {depositNft && depositData && enteredBlock ? (
        <FarmDetailsModalValues
          depositData={depositData}
          yieldFarmId={farm.yieldFarm.id.toString()}
          depositNft={depositNft}
          enteredBlock={enteredBlock}
        />
      ) : (
        <Text sx={{ pt: 30 }} color="basic400" tAlign="center">
          {t("farms.modal.details.description")}
        </Text>
      )}
    </>
  )
}
