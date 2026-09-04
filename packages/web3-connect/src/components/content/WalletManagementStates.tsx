import {
  CircleAlert,
  HydrationLogo,
  WalletIcon,
} from "@galacticcouncil/ui/assets/icons"
import { Flex, Icon, Spinner, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { ChevronRight, Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  SRightColumn,
  SRightColumnBody,
} from "@/components/content/WalletManagementContent.styled"
import {
  WalletSourceButton,
  WalletSourceGroup,
} from "@/components/content/WalletManagementSource"
import { SSourceAction } from "@/components/content/WalletManagementSource.styled"
import {
  SCenteredTextGroup,
  SChainSelectHeader,
  SWalletConnectBody,
  SWalletConnectButton,
  SWalletConnectState,
  SWalletErrorBody,
  SWalletErrorIcon,
  SWalletErrorRetryButton,
  SWalletErrorState,
  SWalletMark,
} from "@/components/content/WalletManagementStates.styled"
import { WalletProviderType } from "@/config/providers"
import { getWalletModeIcon, WalletMode } from "@/config/wallet"
import { WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { Wallet } from "@/types/wallet"
import {
  getWalletPrimaryMode,
  getWalletSourceModeLabel,
} from "@/utils/walletSource"

/**
 * The three things the right panel shows instead of an account list: a failed
 * connection, a brand's chain picker, and a wallet that is not connected yet.
 */
export const WalletErrorState: React.FC<{
  readonly error: string
  readonly onRetry?: () => void
}> = ({ error, onRetry }) => {
  const { t } = useTranslation()

  return (
    <SWalletErrorState>
      <SWalletErrorBody>
        <SWalletErrorIcon>
          <Icon size="s" component={CircleAlert} />
        </SWalletErrorIcon>
        <SCenteredTextGroup>
          <Text
            fs="h7"
            fw={500}
            lh={1}
            font="primary"
            align="center"
            color={getToken("text.high")}
          >
            {t("error.title")}
          </Text>
          <Text fs="p5" lh={1.3} color={getToken("text.medium")} align="center">
            {error || t("error.unknown")}
          </Text>
        </SCenteredTextGroup>
        {onRetry && (
          <SWalletErrorRetryButton
            variant="secondary"
            size="small"
            onClick={onRetry}
          >
            {t("error.retry")}
          </SWalletErrorRetryButton>
        )}
      </SWalletErrorBody>
    </SWalletErrorState>
  )
}

export const WalletChainSelectState: React.FC<{
  readonly group: WalletSourceGroup
  readonly getStatus: (
    provider: WalletProviderType | null,
  ) => WalletProviderStatus
  readonly onConnect: (wallet: Wallet) => void
  readonly onInstall: (wallet: Wallet) => void
  readonly onSelect: (wallet: Wallet) => void
}> = ({ group, getStatus, onConnect, onInstall, onSelect }) => {
  const { t } = useTranslation()
  const selectableWallets = group.wallets.filter((wallet) => {
    const status = getStatus(wallet.provider)
    return wallet.installed || status === WalletProviderStatus.Connected
  })

  return (
    <SRightColumn>
      <SChainSelectHeader>
        {group.logo && <SWalletMark src={group.logo} alt="" />}
        <Text
          fs="h7"
          fw={500}
          lh={1}
          font="primary"
          align="center"
          color={getToken("text.high")}
        >
          {group.title}
        </Text>
      </SChainSelectHeader>

      <SRightColumnBody>
        <Flex direction="column" gap="s">
          {selectableWallets.map((wallet) => {
            const status = getStatus(wallet.provider)
            const isConnected = status === WalletProviderStatus.Connected
            const isPending = status === WalletProviderStatus.Pending
            const mode = getWalletPrimaryMode(wallet.provider)
            const modeIcon = mode ? getWalletModeIcon(mode) : ""

            return (
              <WalletSourceButton
                key={wallet.provider}
                title={getWalletSourceModeLabel(mode)}
                subtitle={
                  isConnected
                    ? t("provider.connected")
                    : wallet.installed
                      ? t("provider.connect")
                      : t("provider.download")
                }
                logo={mode === WalletMode.EVM ? undefined : modeIcon}
                icon={mode === WalletMode.EVM ? HydrationLogo : undefined}
                pending={isPending}
                onClick={() => {
                  if (isPending) return
                  if (isConnected) {
                    onSelect(wallet)
                    return
                  }
                  if (wallet.installed) {
                    onConnect(wallet)
                    return
                  }
                  onInstall(wallet)
                }}
                action={
                  <SSourceAction as="span">
                    <Icon
                      size="xs"
                      component={
                        !wallet.installed && wallet.installUrl
                          ? Download
                          : ChevronRight
                      }
                    />
                  </SSourceAction>
                }
              />
            )
          })}
        </Flex>
      </SRightColumnBody>
    </SRightColumn>
  )
}

export const WalletConnectState: React.FC<{
  readonly wallet: Wallet
  readonly isConnecting: boolean
  readonly onConnect: () => void
}> = ({ wallet, isConnecting, onConnect }) => {
  const { t } = useTranslation()

  return (
    <SWalletConnectState>
      <SWalletConnectBody>
        <SWalletMark src={wallet.logo} alt="" />
        <SCenteredTextGroup>
          <Text
            fs="h7"
            fw={500}
            lh={1}
            font="primary"
            align="center"
            color={getToken("text.high")}
          >
            {wallet.title}
          </Text>
          <Text fs="p5" lh={1.3} color={getToken("text.medium")} align="center">
            {!wallet.installed
              ? t("provider.walletNotInstalledDescription", {
                  wallet: wallet.title,
                })
              : isConnecting
                ? t("provider.connectingWalletDescription")
                : t("provider.walletNotConnectedDescription")}
          </Text>
        </SCenteredTextGroup>
        <SWalletConnectButton
          variant="secondary"
          size="small"
          disabled={isConnecting || (!wallet.installed && !wallet.installUrl)}
          onClick={() => {
            if (!wallet.installed) {
              if (wallet.installUrl) {
                window.open(wallet.installUrl, "_blank", "noopener,noreferrer")
              }
              return
            }

            onConnect()
          }}
        >
          {isConnecting ? (
            <Spinner size="xs" />
          ) : !wallet.installed ? (
            <Icon size="xs" component={Download} />
          ) : (
            <Icon size="xs" component={WalletIcon} />
          )}
          {!wallet.installed
            ? t("provider.installWallet", { wallet: wallet.title })
            : isConnecting
              ? t("provider.connectingWallet")
              : t("provider.connectWallet")}
        </SWalletConnectButton>
      </SWalletConnectBody>
    </SWalletConnectState>
  )
}
