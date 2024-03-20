import { ProtocolAction } from "@aave/contract-helpers"
import { EmodeCategory } from "sections/lending/helpers/types"
import { useTransactionHandler } from "sections/lending/helpers/useTransactionHandler"
import { useRootStore } from "sections/lending/store/root"

import { TxActionsWrapper } from "sections/lending/components/transactions/TxActionsWrapper"
import { getEmodeMessage } from "./EmodeNaming"

export type EmodeActionsProps = {
  isWrongNetwork: boolean
  blocked: boolean
  selectedEmode: number
  activeEmode: number
  eModes: Record<number, EmodeCategory>
}

export const EmodeActions = ({
  isWrongNetwork,
  blocked,
  selectedEmode,
  activeEmode,
  eModes,
}: EmodeActionsProps) => {
  const setUserEMode = useRootStore((state) => state.setUserEMode)

  const { action, loadingTxns, mainTxState, requiresApproval } =
    useTransactionHandler({
      tryPermit: false,
      handleGetTxns: async () => {
        return setUserEMode(selectedEmode)
      },
      skip: blocked,
      deps: [selectedEmode],
      protocolAction: ProtocolAction.setEModeUsage,
      eventTxInfo: {
        previousState: getEmodeMessage(eModes[activeEmode].label),
        newState: getEmodeMessage(eModes[selectedEmode].label),
      },
    })

  return (
    <TxActionsWrapper
      requiresApproval={requiresApproval}
      blocked={blocked}
      mainTxState={mainTxState}
      preparingTransactions={loadingTxns}
      handleAction={action}
      actionText={
        activeEmode === 0 ? (
          <span>Enable E-Mode</span>
        ) : selectedEmode !== 0 ? (
          <span>Switch E-Mode</span>
        ) : (
          <span>Disable E-Mode</span>
        )
      }
      actionInProgressText={
        activeEmode === 0 ? (
          <span>Enabling E-Mode</span>
        ) : selectedEmode !== 0 ? (
          <span>Switching E-Mode</span>
        ) : (
          <span>Disabling E-Mode</span>
        )
      }
      isWrongNetwork={isWrongNetwork}
    />
  )
}
