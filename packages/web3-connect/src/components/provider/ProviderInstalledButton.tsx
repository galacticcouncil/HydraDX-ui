import { useTranslation } from "react-i18next"
import { countBy, pick, prop } from "remeda"
import { useShallow } from "zustand/shallow"

import {
  ProviderButton,
  ProviderButtonOwnProps,
} from "@/components/provider/ProviderButton"
import { Web3ConnectModalPage } from "@/config/modal"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useWeb3Connect, WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { useWeb3Enable } from "@/hooks/useWeb3Enable"

export const ProviderInstalledButton: React.FC<ProviderButtonOwnProps> = ({
  walletData,
  ...props
}) => {
  const { t } = useTranslation()
  const { provider } = walletData
  const { isControlled, setPage } = useWeb3ConnectContext()
  const { enable, disconnect } = useWeb3Enable()

  const { getStatus, accounts } = useWeb3Connect(
    useShallow(pick(["accounts", "getStatus"])),
  )

  const isConnected = getStatus(provider) === WalletProviderStatus.Connected
  const accountCount = countBy(accounts, prop("provider"))[provider] || 0

  const actionProps = (() => {
    if (isControlled) {
      return {
        actionLabel: t("provider.continue"),
        onClick: () =>
          isConnected
            ? setPage(Web3ConnectModalPage.Wallets)
            : enable(provider),
      }
    }
    if (isConnected) {
      return {
        actionLabel: t("provider.disconnect"),
        onClick: () => disconnect(provider),
      }
    }
    return {
      actionLabel: t("provider.continue"),
      onClick: () => enable(provider),
    }
  })()

  return (
    <ProviderButton
      as="button"
      walletData={walletData}
      isConnected={isConnected}
      accountCount={accountCount}
      {...actionProps}
      {...props}
    />
  )
}
