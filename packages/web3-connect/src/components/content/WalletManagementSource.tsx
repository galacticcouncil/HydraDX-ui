import { HydrationLogo } from "@galacticcouncil/ui/assets/icons"
import { Icon, Spinner, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { ChevronRight, LogOut } from "lucide-react"
import { ComponentType } from "react"
import { useTranslation } from "react-i18next"

import {
  SChainBadgeImage,
  SSourceAction,
  SSourceButton,
  SSourceButtonContent,
  SSourceButtonEnd,
  SSourceChainBadge,
  SSourceChainBadges,
  SSourceIcon,
  SSourceLogo,
  SStackedSourceLogo,
  SStackedSourceLogos,
  STruncatingColumn,
} from "@/components/content/WalletManagementSource.styled"
import { WalletProviderType } from "@/config/providers"
import { getWalletModeIcon, WalletMode } from "@/config/wallet"
import { WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { Wallet } from "@/types/wallet"
import {
  getWalletGroupSourceModes,
  getWalletSourceModes,
  WalletSourceGroup as WalletSourceGroupOf,
} from "@/utils/walletSource"
import { getWallet } from "@/wallets"

/**
 * The rows of the wallet-source column: one generic button plus the two
 * shapes it is used in - a single provider, and a brand that ships several.
 */
export type WalletSourceButtonVariant =
  | "management"
  | "firstConnection"
  | "firstConnectionPlain"

export type WalletSourceGroup = WalletSourceGroupOf<Wallet>

type WalletSourceChainBadge = {
  id: string
  icon?: ComponentType
  iconSrc?: string
}

const getWalletSourceChainBadges = (
  modes: WalletMode[],
): WalletSourceChainBadge[] =>
  modes.flatMap((mode) => {
    const modeIcon = getWalletModeIcon(mode)
    const badges: WalletSourceChainBadge[] = []

    if (mode === WalletMode.EVM) {
      badges.push({
        id: "hydration-evm",
        icon: HydrationLogo,
      })
    }

    if (modeIcon) {
      badges.push({
        id: mode,
        iconSrc: modeIcon,
      })
    }

    return badges
  })

export const WalletSourceButton: React.FC<{
  readonly active?: boolean
  readonly title: string
  readonly subtitle?: string
  readonly logo?: string
  readonly logos?: WalletProviderType[]
  readonly icon?: ComponentType
  readonly pending?: boolean
  readonly variant?: WalletSourceButtonVariant
  readonly chainModes?: WalletMode[]
  readonly action?: React.ReactNode
  readonly onClick: () => void
}> = ({
  active,
  title,
  subtitle,
  logo,
  logos,
  icon,
  pending,
  variant = "management",
  chainModes,
  action,
  onClick,
}) => (
  <SSourceButton
    type="button"
    data-active={active}
    data-variant={variant}
    onClick={onClick}
  >
    <SSourceButtonContent>
      {logo ? (
        <SSourceLogo src={logo} alt="" lazy={false} />
      ) : icon ? (
        <SSourceIcon>
          <Icon size="xs" component={icon} />
        </SSourceIcon>
      ) : logos?.length ? (
        <SStackedSourceLogos>
          {logos.slice(0, 3).map((provider) => {
            const wallet = getWallet(provider)
            if (!wallet) return null
            return (
              <SStackedSourceLogo
                key={provider}
                src={wallet.logo}
                alt=""
                lazy={false}
              />
            )
          })}
        </SStackedSourceLogos>
      ) : null}
      <STruncatingColumn>
        <Text fs="p5" fw={500} color="text.high" truncate>
          {title}
        </Text>
        {subtitle && (
          <Text
            fs="p7"
            fw={500}
            lh="xs"
            color={getToken("text.medium")}
            truncate
          >
            {subtitle}
          </Text>
        )}
      </STruncatingColumn>
    </SSourceButtonContent>
    {pending ? (
      <Spinner size="xs" />
    ) : variant === "firstConnectionPlain" ? null : (
      <SSourceButtonEnd>
        {chainModes && chainModes.length > 0 && (
          <WalletSourceChainBadges modes={chainModes} />
        )}
        {action || (
          <SSourceAction as="span">
            <Icon size="xs" component={ChevronRight} />
          </SSourceAction>
        )}
      </SSourceButtonEnd>
    )}
  </SSourceButton>
)

export const WalletSourceChainBadges: React.FC<{
  readonly modes: WalletMode[]
}> = ({ modes }) => {
  const badges = getWalletSourceChainBadges(modes)

  return (
    <SSourceChainBadges>
      {badges.slice(0, 4).map((badge) => (
        <SSourceChainBadge key={badge.id}>
          {badge.icon ? (
            <Icon size="xs" component={badge.icon} />
          ) : badge.iconSrc ? (
            <SChainBadgeImage src={badge.iconSrc} alt="" lazy={false} />
          ) : null}
        </SSourceChainBadge>
      ))}
    </SSourceChainBadges>
  )
}

export const WalletProviderSourceButton: React.FC<{
  readonly wallet?: Wallet
  readonly active: boolean
  readonly status: WalletProviderStatus
  readonly pending: boolean
  readonly variant?: WalletSourceButtonVariant
  readonly onClick: () => void
  readonly onDisconnect: () => void
}> = ({
  wallet,
  active,
  status,
  pending,
  variant = "management",
  onClick,
  onDisconnect,
}) => {
  const { t } = useTranslation()

  if (!wallet) return null

  const isConnected = status === WalletProviderStatus.Connected
  const chainModes =
    variant === "management" ? undefined : getWalletSourceModes(wallet.provider)

  return (
    <WalletSourceButton
      active={active}
      title={wallet.title}
      subtitle={isConnected ? t("provider.connected") : t("provider.connect")}
      logo={wallet.logo}
      pending={pending}
      variant={variant}
      chainModes={chainModes}
      onClick={onClick}
      action={
        isConnected ? (
          <SSourceAction
            as="span"
            aria-label={t("provider.disconnect")}
            onClick={(event) => {
              event.stopPropagation()
              onDisconnect()
            }}
          >
            <Icon size="xs" component={LogOut} />
          </SSourceAction>
        ) : (
          <SSourceAction as="span">
            <Icon size="xs" component={ChevronRight} />
          </SSourceAction>
        )
      }
    />
  )
}

export const WalletGroupSourceButton: React.FC<{
  readonly group: WalletSourceGroup
  readonly active: boolean
  readonly connected: boolean
  readonly pending: boolean
  readonly variant?: WalletSourceButtonVariant
  readonly onClick: () => void
}> = ({
  group,
  active,
  connected,
  pending,
  variant = "management",
  onClick,
}) => {
  const { t } = useTranslation()

  return (
    <WalletSourceButton
      active={active}
      title={group.title}
      subtitle={connected ? t("provider.connected") : t("provider.connect")}
      logo={group.logo}
      pending={pending}
      variant={variant}
      chainModes={getWalletGroupSourceModes(group)}
      onClick={onClick}
    />
  )
}
