import { InterestRate, ProtocolAction } from "@aave/contract-helpers"
import { useTransactionHandler } from "sections/lending/helpers/useTransactionHandler"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useRootStore } from "sections/lending/store/root"
import { IPool__factory } from "@aave/contract-helpers/src/v3-pool-contract/typechain/IPool__factory"
import { TxActionsWrapper } from "sections/lending/components/transactions/TxActionsWrapper"
import { getFunctionDefsFromAbi } from "sections/lending/utils/utils"

export type RateSwitchActionsProps = {
  poolReserve: ComputedReserveData
  isWrongNetwork: boolean
  currentRateMode: InterestRate
  blocked: boolean
}

export const RateSwitchActions = ({
  poolReserve,
  isWrongNetwork,
  currentRateMode,
  blocked,
}: RateSwitchActionsProps) => {
  const swapBorrowRateMode = useRootStore((state) => state.swapBorrowRateMode)

  const { action, loadingTxns, mainTxState, requiresApproval } =
    useTransactionHandler({
      tryPermit: false,
      handleGetTxns: async () => {
        return await swapBorrowRateMode({
          reserve: poolReserve.underlyingAsset,
          interestRateMode: currentRateMode,
        })
      },
      protocolAction: ProtocolAction.switchBorrowRateMode,
      eventTxInfo: {
        asset: poolReserve.underlyingAsset,
        assetName: poolReserve.name,
        previousState: currentRateMode,
        newState:
          currentRateMode === InterestRate.Variable
            ? InterestRate.Stable
            : InterestRate.Variable,
      },
      skip: blocked,
      abi: getFunctionDefsFromAbi(IPool__factory.abi, "swapBorrowRateMode"),
    })

  return (
    <TxActionsWrapper
      requiresApproval={requiresApproval}
      blocked={blocked}
      preparingTransactions={loadingTxns}
      mainTxState={mainTxState}
      isWrongNetwork={isWrongNetwork}
      actionText={<span>Switch rate</span>}
      actionInProgressText={<span>Switching rate</span>}
      handleAction={action}
    />
  )
}
