import { useAccount, Web3ConnectButton } from "@galacticcouncil/web3-connect"
import { Web3ConnectButtonProps } from "@galacticcouncil/web3-connect/src/components/Web3ConnectButton"
import { FC } from "react"

/**
 * Wraps an action that ends in a Hydration signature. Any wallet may be
 * connected; only an account Hydration can use may drive the action, so a
 * Solana or Sui account gets the connect button and a prompt to pick another.
 *
 * Cross-chain actions are signed on their source chain and use
 * `AuthorizedActionForChain` instead - this component does not know or care
 * which route it renders on.
 */
export const AuthorizedAction: FC<Web3ConnectButtonProps> = ({
  children,
  ...props
}) => {
  const { account } = useAccount()

  if (account?.canUseOnHydration) return children

  return <Web3ConnectButton {...props} requiresHydrationAccount />
}
