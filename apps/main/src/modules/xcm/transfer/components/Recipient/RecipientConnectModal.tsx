import {
  Account,
  WalletMode,
  Web3ConnectModalV2,
} from "@galacticcouncil/web3-connect"
import { AnyChain } from "@galacticcouncil/xc-core"

import { neckworkClient } from "@/api/neckwork"
import { getWalletModeByChain } from "@/modules/xcm/transfer/utils/chain"
import { useRpcProvider } from "@/providers/rpcProvider"

export type RecipientConnectModalProps = {
  open: boolean
  destChain: AnyChain | null
  onOpenChange: (open: boolean) => void
  onAccountSelect: (account: Account) => void
}

export const RecipientConnectModal: React.FC<RecipientConnectModalProps> = ({
  open,
  destChain,
  onOpenChange,
  onAccountSelect,
}) => {
  const { papi } = useRpcProvider()
  const walletMode = destChain ? getWalletModeByChain(destChain) : null

  return (
    <Web3ConnectModalV2
      neckwork={neckworkClient}
      papi={papi}
      open={open}
      mode={walletMode ?? WalletMode.Default}
      onOpenChange={onOpenChange}
      onAccountSelect={onAccountSelect}
    />
  )
}
