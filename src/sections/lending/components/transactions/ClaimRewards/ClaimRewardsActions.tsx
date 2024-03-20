import { ProtocolAction } from "@aave/contract-helpers"
import { Reward } from "sections/lending/helpers/types"
import { useTransactionHandler } from "sections/lending/helpers/useTransactionHandler"
import { useRootStore } from "sections/lending/store/root"

import { TxActionsWrapper } from "sections/lending/components/transactions/TxActionsWrapper"

export type ClaimRewardsActionsProps = {
  isWrongNetwork: boolean
  blocked: boolean
  selectedReward: Reward
}

export const ClaimRewardsActions = ({
  isWrongNetwork,
  blocked,
  selectedReward,
}: ClaimRewardsActionsProps) => {
  const claimRewards = useRootStore((state) => state.claimRewards)

  const { action, loadingTxns, mainTxState, requiresApproval } =
    useTransactionHandler({
      protocolAction: ProtocolAction.claimRewards,
      eventTxInfo: {
        assetName: selectedReward.symbol,
        amount: selectedReward.balance,
      },
      tryPermit: false,
      handleGetTxns: async () => {
        return claimRewards({ isWrongNetwork, blocked, selectedReward })
      },
      skip: Object.keys(selectedReward).length === 0 || blocked,
      deps: [selectedReward],
    })

  return (
    <TxActionsWrapper
      requiresApproval={requiresApproval}
      blocked={blocked}
      preparingTransactions={loadingTxns}
      mainTxState={mainTxState}
      handleAction={action}
      actionText={
        selectedReward.symbol === "all" ? (
          <span>Claim all</span>
        ) : (
          <span>Claim {selectedReward.symbol}</span>
        )
      }
      actionInProgressText={<span>Claiming</span>}
      isWrongNetwork={isWrongNetwork}
    />
  )
}
