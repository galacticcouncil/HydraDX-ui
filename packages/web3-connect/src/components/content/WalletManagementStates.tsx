import { Box, Flex, Icon, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { ChevronRight, Download, LogOut } from "lucide-react"
import type { ComponentType } from "react"
import { useTranslation } from "react-i18next"

import { SRightColumn } from "@/components/content/WalletManagementContent.styled"
import {
  WalletSourceButton,
  WalletSourceGroup,
} from "@/components/content/WalletManagementSource"
import { SSourceAction } from "@/components/content/WalletManagementSource.styled"
import {
  SCenteredTextGroup,
  SChainSelectHeader,
  SWalletConnectionAction,
  SWalletConnectionBody,
  SWalletConnectionErrorRing,
  SWalletConnectionLogo,
  SWalletConnectionSpinner,
  SWalletConnectionState,
  SWalletConnectionStatusIcon,
  SWalletConnectionVisual,
  SWalletMark,
} from "@/components/content/WalletManagementStates.styled"
import { WalletProviderType } from "@/config/providers"
import { getWalletModeIcon } from "@/config/wallet"
import { WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { Wallet } from "@/types/wallet"
import {
  getWalletPrimaryMode,
  getWalletSourceAction,
  getWalletSourceModeLabel,
} from "@/utils/walletSource"

export type WalletConnectionStateVisual =
  | {
      readonly type: "icon"
      readonly icon: ComponentType
    }
  | {
      readonly type: "wallet"
      readonly wallet: Wallet
    }
  | {
      readonly type: "loading"
      readonly wallet: Wallet
    }
  | {
      readonly type: "error"
      readonly wallet: Wallet
    }

type WalletConnectionStateAction = {
  readonly label: string
  readonly icon?: ComponentType
  readonly disabled?: boolean
  readonly onClick?: () => void
}

type WalletConnectionStateProps = {
  readonly title: string
  readonly description: string
  readonly visual: WalletConnectionStateVisual
  readonly action?: WalletConnectionStateAction
}

export const WalletConnectionState: React.FC<WalletConnectionStateProps> = ({
  title,
  description,
  visual,
  action,
}) => {
  const isLoading = visual.type === "loading"
  const isError = visual.type === "error"

  return (
    <SWalletConnectionState
      role={visual.type === "icon" || isError ? "alert" : "status"}
      aria-live="polite"
    >
      <SWalletConnectionBody>
        <SWalletConnectionVisual>
          {visual.type === "icon" ? (
            <SWalletConnectionStatusIcon>
              <Icon size="xl" component={visual.icon} />
            </SWalletConnectionStatusIcon>
          ) : (
            <>
              {isLoading && <SWalletConnectionSpinner />}
              {isError && <SWalletConnectionErrorRing />}
              <SWalletConnectionLogo
                src={visual.wallet.logo}
                alt=""
                data-framed={isLoading || isError}
                lazy={false}
              />
            </>
          )}
        </SWalletConnectionVisual>

        <SCenteredTextGroup>
          <Text
            fs="h7"
            fw={500}
            lh={1}
            font="primary"
            align="center"
            color={getToken("text.high")}
          >
            {title}
          </Text>
          <Text
            fs="p4"
            lh={1.3}
            color={getToken("text.medium")}
            align="center"
            textWrap="balance"
            px="l"
          >
            {description}
          </Text>
        </SCenteredTextGroup>

        {action && (
          <SWalletConnectionAction
            variant="secondary"
            size="medium"
            isLoading={isLoading}
            disabled={action.disabled || isLoading}
            onClick={action.onClick}
          >
            {action.icon && <Icon size="xs" component={action.icon} />}
            {action.label}
          </SWalletConnectionAction>
        )}
      </SWalletConnectionBody>
    </SWalletConnectionState>
  )
}

export const WalletChainSelectState: React.FC<{
  readonly group: WalletSourceGroup
  readonly getStatus: (
    provider: WalletProviderType | null,
  ) => WalletProviderStatus
  readonly onInstall: (wallet: Wallet) => void
  readonly onSelect: (wallet: Wallet) => void
  readonly onDisconnect: (wallet: Wallet) => void
}> = ({ group, getStatus, onInstall, onSelect, onDisconnect }) => {
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

      <Box flex={1} sx={{ minHeight: 0, overflowY: "auto" }}>
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
                      : t("provider.notInstalled")
                }
                connected={isConnected}
                logo={modeIcon}
                pending={isPending}
                onClick={() => {
                  if (isPending) return

                  if (getWalletSourceAction(wallet, status) === "install") {
                    onInstall(wallet)
                    return
                  }

                  // select the mode first, so the panel follows the click
                  // through connecting and into that mode's accounts
                  onSelect(wallet)
                }}
                action={
                  isConnected ? (
                    <SSourceAction
                      as="span"
                      aria-label={t("provider.disconnect")}
                      onClick={(event) => {
                        event.stopPropagation()
                        onDisconnect(wallet)
                      }}
                    >
                      <Icon size="xs" component={LogOut} />
                    </SSourceAction>
                  ) : (
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
                  )
                }
              />
            )
          })}
        </Flex>
      </Box>
    </SRightColumn>
  )
}
