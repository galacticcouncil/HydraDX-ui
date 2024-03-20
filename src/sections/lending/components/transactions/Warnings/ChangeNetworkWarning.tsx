import { ChainId } from "@aave/contract-helpers"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"

import { Warning } from "sections/lending/components/primitives/Warning"
import { Button } from "components/Button/Button"

export type ChangeNetworkWarningProps = {
  networkName: string
  chainId: ChainId
  className?: string
}

export const ChangeNetworkWarning = ({
  networkName,
  chainId,
  className,
}: ChangeNetworkWarningProps) => {
  const { switchNetwork, switchNetworkError } = useWeb3Context()

  const handleSwitchNetwork = () => {
    switchNetwork(chainId)
  }
  return (
    <Warning variant="error" className={className}>
      {switchNetworkError ? (
        <span>
          Seems like we can&apos;t switch the network automatically. Please
          check if you can change it from the wallet.
        </span>
      ) : (
        <span
          sx={{
            flex: "row",
            justify: "space-between",
            align: "center",
            gap: 4,
          }}
        >
          <span>Please switch to {networkName}.</span>{" "}
          <Button size="micro" variant="outline" onClick={handleSwitchNetwork}>
            Switch Network
          </Button>
        </span>
      )}
    </Warning>
  )
}
