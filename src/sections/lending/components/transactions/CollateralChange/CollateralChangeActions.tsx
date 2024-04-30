import { ProtocolAction } from "@aave/contract-helpers"
import { useTransactionHandler } from "sections/lending/helpers/useTransactionHandler"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useRootStore } from "sections/lending/store/root"

import { TxActionsWrapper } from "sections/lending/components/transactions/TxActionsWrapper"
import { getFunctionDefsFromAbi } from "sections/lending/utils/utils"
import { IPool__factory } from "@aave/contract-helpers/src/v3-pool-contract/typechain/IPool__factory"

export type CollateralChangeActionsProps = {
  poolReserve: ComputedReserveData
  isWrongNetwork: boolean
  usageAsCollateral: boolean
  blocked: boolean
  symbol: string
}

export const CollateralChangeActions = ({
  poolReserve,
  isWrongNetwork,
  usageAsCollateral,
  blocked,
  symbol,
}: CollateralChangeActionsProps) => {
  const setUsageAsCollateral = useRootStore(
    (state) => state.setUsageAsCollateral,
  )

  const { action, loadingTxns, mainTxState, requiresApproval } =
    useTransactionHandler({
      tryPermit: false,
      protocolAction: ProtocolAction.setUsageAsCollateral,
      eventTxInfo: {
        assetName: poolReserve.name,
        asset: poolReserve.underlyingAsset,
        previousState: (!usageAsCollateral).toString(),
        newState: usageAsCollateral.toString(),
      },

      handleGetTxns: async () => {
        return setUsageAsCollateral({
          reserve: poolReserve.underlyingAsset,
          usageAsCollateral,
        })
      },
      skip: blocked,
      abi: getFunctionDefsFromAbi(
        IPool__factory.abi,
        "setUserUseReserveAsCollateral",
      ),
    })

  return (
    <TxActionsWrapper
      requiresApproval={requiresApproval}
      blocked={blocked}
      preparingTransactions={loadingTxns}
      mainTxState={mainTxState}
      isWrongNetwork={isWrongNetwork}
      actionText={
        usageAsCollateral ? (
          <span>Enable {symbol} as collateral</span>
        ) : (
          <span>Disable {symbol} as collateral</span>
        )
      }
      actionInProgressText={<span>Pending...</span>}
      handleAction={action}
    />
  )
}
