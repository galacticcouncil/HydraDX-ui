import { useAccount, Web3ConnectButton } from "@galacticcouncil/web3-connect"
import { Web3ConnectButtonProps } from "@galacticcouncil/web3-connect/src/components/Web3ConnectButton"
import { AnyChain } from "@galacticcouncil/xc-core"
import { FC } from "react"

import { getWalletModeByChain } from "@/modules/xcm/transfer/utils/chain"

type Props = Omit<
  Web3ConnectButtonProps,
  "mode" | "requiresHydrationAccount"
> & {
  chain: AnyChain | null
}

export const AuthorizedActionForChain: FC<Props> = ({
  children,
  chain,
  ...props
}) => {
  const { account } = useAccount()

  if (!account) {
    return (
      <Web3ConnectButton
        {...props}
        mode={chain ? getWalletModeByChain(chain) : undefined}
      />
    )
  }

  return children
}
