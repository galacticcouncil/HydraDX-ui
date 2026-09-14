import { WalletModalStatesPanel } from "@galacticcouncil/web3-connect"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/wallet-modal-states")({
  component: WalletModalStatesPanel,
})
