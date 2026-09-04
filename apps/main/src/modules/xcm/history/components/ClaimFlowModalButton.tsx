import { CheckIcon, CopyIcon } from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  CopyButton,
  Icon,
  MicroButton,
  Modal,
  ModalBody,
  ModalHeader,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import {
  useAccount,
  WalletMode,
  Web3ConnectModalV2,
} from "@galacticcouncil/web3-connect"
import type { XcJourney } from "@galacticcouncil/xc-scan"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { neckworkClient } from "@/api/neckwork"
import { TransactionStatus } from "@/components/TransactionStatus"
import { ClaimPendingModalContent } from "@/modules/xcm/history/components/ClaimPendingModalContent"
import { useDepositClaim } from "@/modules/xcm/history/hooks/useDepositClaim"
import { useWithdrawClaim } from "@/modules/xcm/history/hooks/useWithdrawClaim"
import { getTransferAsset } from "@/modules/xcm/history/utils/assets"
import { resolveChainFromUrn } from "@/modules/xcm/history/utils/claim"
import { getWalletModeByChain } from "@/modules/xcm/transfer/utils/chain"
import { useRpcProvider } from "@/providers/rpcProvider"

type DepositMutation = ReturnType<typeof useDepositClaim>
type WithdrawMutation = ReturnType<typeof useWithdrawClaim>

type ClaimFlowModalButtonProps =
  | {
      type: "deposit"
      journey: XcJourney
      mutation: DepositMutation
    }
  | {
      type: "withdraw"
      journey: XcJourney
      mutation: WithdrawMutation
    }

export const ClaimFlowModalButton: React.FC<ClaimFlowModalButtonProps> = ({
  type,
  journey,
  mutation,
}) => {
  const { t } = useTranslation("common")
  const { papi } = useRpcProvider()
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useAccount()

  const chain = resolveChainFromUrn(journey.destination)
  const walletMode = chain ? getWalletModeByChain(chain) : WalletMode.EVM

  const { mutate, isPending, error, reset } = mutation

  const transferAsset = getTransferAsset(journey)

  if (!account) return null

  const onClick =
    type === "withdraw" ? () => setModalOpen(true) : () => mutate(account)

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        disabled={isPending}
        onClick={onClick}
      >
        {isPending ? t("claiming") : t("claim")}
      </Button>
      <Web3ConnectModalV2
        neckwork={neckworkClient}
        papi={papi}
        open={modalOpen}
        mode={walletMode}
        onOpenChange={setModalOpen}
        onAccountSelect={(account) => {
          setModalOpen(false)
          mutate(account)
        }}
      />
      <Modal
        open={isPending || !!error}
        onOpenChange={error ? reset : undefined}
      >
        <ModalHeader
          title={
            transferAsset
              ? t("claim.asset", { symbol: transferAsset.symbol })
              : t("claim")
          }
          closable={!!error}
        />
        <ModalBody>
          {error ? (
            <TransactionStatus
              status="error"
              errorActions={
                <CopyButton text={error.message}>
                  {({ copied }) => (
                    <MicroButton
                      as="div"
                      sx={{
                        color: copied && getToken("accents.success.emphasis"),
                      }}
                    >
                      <Icon
                        size="xs"
                        component={copied ? CheckIcon : CopyIcon}
                      />
                      {copied ? t("copied") : t("copyError")}
                    </MicroButton>
                  )}
                </CopyButton>
              }
            />
          ) : (
            <ClaimPendingModalContent />
          )}
        </ModalBody>
      </Modal>
    </>
  )
}
