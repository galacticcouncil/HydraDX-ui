import { useTranslation } from "react-i18next"
import { Graph } from "components/Graph/Graph"
import { Spinner } from "components/Spinner/Spinner"
import { useLoyaltyRates } from "./LoyaltyGraph.utils"
import { PalletLiquidityMiningLoyaltyCurve } from "@polkadot/types/lookup"
import BigNumber from "bignumber.js"
import { Farm, useFarmApr } from "api/farms"

type LoyaltyGraphProps = {
  farm: Farm
  loyaltyCurve: PalletLiquidityMiningLoyaltyCurve
  enteredAt?: BigNumber
  currentBlock: number
}

export const LoyaltyGraph = ({
  farm,
  loyaltyCurve,
  enteredAt,
  currentBlock,
}: LoyaltyGraphProps) => {
  const { t } = useTranslation()
  const apr = useFarmApr(farm)

  const rates = useLoyaltyRates(
    farm,
    apr.data?.apr,
    loyaltyCurve,
    enteredAt ? BigNumber(currentBlock).minus(enteredAt) : undefined,
  )

  return (
    <div sx={{ height: 300, flex: "row", align: "center", justify: "center" }}>
      {rates.data ? (
        <Graph
          labelX={t("farms.modal.details.loyalty.x")}
          labelY={t("farms.modal.details.loyalty.y")}
          data={rates.data}
        />
      ) : (
        <Spinner size={64} />
      )}
    </div>
  )
}
