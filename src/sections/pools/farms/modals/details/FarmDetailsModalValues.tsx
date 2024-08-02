import BigNumber from "bignumber.js"
import { useTranslation } from "react-i18next"
import { useEnteredDate } from "utils/block"
import { useClaimableAmount } from "utils/farms/claiming"
import {
  isXYKDeposit,
  TDepositData,
} from "sections/pools/farms/position/FarmingPosition.utils"
import { Summary } from "components/Summary/Summary"
import { useAssets } from "providers/assets"
import { usePoolData } from "sections/pools/pool/Pool"
import { TDeposit } from "api/deposits"

type FarmDetailsModalValuesProps = {
  depositNft: TDeposit
  depositData: TDepositData
  enteredBlock: BigNumber
  yieldFarmId: string
}

export const FarmDetailsModalValues = ({
  depositNft,
  depositData,
  enteredBlock,
  yieldFarmId,
}: FarmDetailsModalValuesProps) => {
  const { t } = useTranslation()
  const { pool } = usePoolData()
  const { getAssetWithFallback } = useAssets()
  const claimable = useClaimableAmount(pool.id, depositNft)

  const depositReward = claimable.data?.depositRewards.find(
    (reward) => reward.yieldFarmId === yieldFarmId,
  )

  const meta = depositReward?.assetId
    ? getAssetWithFallback(depositReward.assetId)
    : undefined
  const entered = useEnteredDate(enteredBlock)

  return (
    <div sx={{ pt: 22 }}>
      <Summary
        rows={[
          {
            label: t("farms.modal.details.joinedOn.label"),
            content: t("farms.positions.labels.enterDate.value", {
              date: entered.data,
            }),
          },
          {
            label: t("farms.modal.details.value.label"),
            content: isXYKDeposit(depositData)
              ? [
                  t("value.tokenWithSymbol", {
                    value: depositData.assetA.amount,
                    symbol: depositData.assetA.symbol,
                  }),
                  t("value.tokenWithSymbol", {
                    value: depositData.assetA.amount,
                    symbol: depositData.assetA.symbol,
                  }),
                ].join(" | ")
              : t("value.tokenWithSymbol", {
                  value: depositData.totalValueShifted,
                  symbol: depositData.meta.symbol,
                }),
          },
          {
            label: t("farms.modal.details.mined.label"),
            content: t("farms.modal.details.mined.value", {
              value: depositReward?.value,
              symbol: meta?.symbol,
              fixedPointScale: meta?.decimals,
            }),
          },
        ]}
      />
    </div>
  )
}
