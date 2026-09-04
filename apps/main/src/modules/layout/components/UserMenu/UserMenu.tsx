import {
  Box,
  ButtonIcon,
  Chip,
  CopyButton,
  Flex,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Icon,
  MenuItemAction,
  MenuItemDescription,
  MenuItemIcon,
  MenuItemLabel,
  MenuSelectionItem,
  MicroButton,
  Separator,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken, pxToRem } from "@galacticcouncil/ui/utils"
import {
  formatCurrency,
  shortenAccountAddress,
  stringEquals,
} from "@galacticcouncil/utils"
import {
  COMPATIBLE_WALLET_PROVIDERS,
  useAccount,
  useAccountBalancesMap,
  useWeb3Connect,
  useWeb3ConnectModal,
  WalletProviderStatus,
} from "@galacticcouncil/web3-connect"
import { ProviderLogo } from "@galacticcouncil/web3-connect/src/components/provider/ProviderLogo"
import { WalletProviderType } from "@galacticcouncil/web3-connect/src/config/providers"
import { getWallet } from "@galacticcouncil/web3-connect/src/wallets"
import { Link } from "@tanstack/react-router"
import { LogOut, Plus, WalletIcon } from "lucide-react"
import { FC, ReactNode, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { pick } from "remeda"
import { useShallow } from "zustand/react/shallow"

import { neckworkClient } from "@/api/neckwork"
import {
  getRecentProviderAccount,
  useRecentProviderAccountsStore,
} from "@/states/recentProviderAccounts"

import { SHoverActions } from "./UserMenu.styled"
import { UserMenuChangeAccountButton } from "./UserMenuChangeAccountButton"

const useHoverWalletBalances = (
  accounts: ReturnType<typeof useAccount>["accounts"],
  enabled: boolean,
) => {
  const { setBalances } = useWeb3Connect(useShallow(pick(["setBalances"])))

  const hydrationAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        COMPATIBLE_WALLET_PROVIDERS.includes(account.provider),
      ),
    [accounts],
  )

  const accountsToFetch = useMemo(() => {
    const byPublicKey = new Map<string, (typeof accounts)[number]>()

    for (const account of hydrationAccounts) {
      if (account.balance !== undefined || byPublicKey.has(account.publicKey)) {
        continue
      }
      byPublicKey.set(account.publicKey, account)
    }

    return [...byPublicKey.values()]
  }, [hydrationAccounts])

  const { balancesMap, isLoading } = useAccountBalancesMap({
    accounts: accountsToFetch,
    neckwork: neckworkClient,
    enabled,
  })

  useEffect(() => {
    if (!isLoading && balancesMap.size > 0) {
      setBalances(balancesMap)
    }
  }, [balancesMap, isLoading, setBalances])

  return useMemo(() => {
    const balances = new Map(balancesMap)

    for (const account of hydrationAccounts) {
      if (account.balance !== undefined) {
        balances.set(account.publicKey, account.balance)
      }
    }

    return {
      balances,
      isLoading,
    }
  }, [balancesMap, hydrationAccounts, isLoading])
}

const UserMenuSeparator = () => (
  <Separator
    sx={{
      my: "base",
      mx: "-base",
    }}
  />
)

type Props = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onHoverStart: () => void
  readonly onHoverEnd: () => void
  readonly anchor: ReactNode
}

export const UserMenu: FC<Props> = ({
  open,
  onOpenChange,
  onHoverStart,
  onHoverEnd,
  anchor,
}) => {
  const { t } = useTranslation()
  const { account, accounts } = useAccount()
  const { toggle } = useWeb3ConnectModal()
  const { providers, storedAccounts, setAccount, disconnect } = useWeb3Connect(
    useShallow((s) => ({
      providers: s.providers,
      storedAccounts: s.accounts,
      setAccount: s.setAccount,
      disconnect: s.disconnect,
    })),
  )
  const recentByProvider = useRecentProviderAccountsStore(
    (s) => s.recentByProvider,
  )

  const { balances: balancesByAccount } = useHoverWalletBalances(accounts, open)

  if (!account) return null

  const connectedTypes = providers
    .filter((p) => p.status === WalletProviderStatus.Connected)
    .map((p) => p.type)

  const openManageWallets = (initialProvider?: WalletProviderType) => {
    onOpenChange(false)
    toggle(undefined, { initialProvider })
  }

  return (
    <HoverCard open={open} onOpenChange={onOpenChange} closeDelay={180}>
      <HoverCardTrigger asChild>{anchor}</HoverCardTrigger>
      <HoverCardContent
        align="end"
        sideOffset={8}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        sx={{
          minWidth: pxToRem(360),
          maxHeight: "var(--radix-hover-card-content-available-height)",
          overflowY: "auto",
        }}
      >
        <Flex align="center" justify="space-between" gap="s" py="base" px="m">
          <Flex align="center" gap="base">
            <Icon
              size="l"
              component={WalletIcon}
              color={getToken("text.medium")}
            />
            <Text fw={600} fs="p3">
              {t("userMenu.connectedWallets")}
            </Text>
          </Flex>
          <MicroButton sx={{ py: "s" }} asChild>
            <Link to="/wallet" onClick={() => onOpenChange(false)}>
              {t("userMenu.goToWallet")}
            </Link>
          </MicroButton>
        </Flex>

        <UserMenuSeparator />

        {connectedTypes.map((type) => {
          const wallet = getWallet(type)
          const providerAccounts = accounts.filter((a) => a.provider === type)
          const recentAccount = getRecentProviderAccount(
            type,
            providerAccounts,
            recentByProvider,
          )
          if (!wallet || !recentAccount) return null

          const isActiveProvider = type === account.provider
          const address = isActiveProvider
            ? account.displayAddress
            : recentAccount.displayAddress

          const storedRecentAccount = storedAccounts.find(
            (a) =>
              a.provider === type && a.publicKey === recentAccount.publicKey,
          )

          const accountName = isActiveProvider
            ? account.name
            : recentAccount.name
          const shortAddress = shortenAccountAddress(address)
          const isExternalWallet = type === WalletProviderType.ExternalWallet
          const hasDistinctName =
            accountName && !stringEquals(accountName, shortAddress)
          const copyLabel = t("userMenu.copyAddress")
          const disconnectLabel = t("userMenu.disconnect", {
            provider: wallet.title,
          })
          const hydrationAccounts = providerAccounts.filter((account) =>
            COMPATIBLE_WALLET_PROVIDERS.includes(account.provider),
          )
          const providerBalance = hydrationAccounts.reduce<number | null>(
            (total, providerAccount) => {
              const balance = balancesByAccount.get(providerAccount.publicKey)
              if (balance === undefined) return null
              return (total ?? 0) + balance
            },
            hydrationAccounts.length > 0 ? 0 : null,
          )
          const hasPositiveBalance =
            providerBalance !== null && providerBalance > 0
          const accountSummary = hasPositiveBalance
            ? t("userMenu.accountsBalance", {
                count: providerAccounts.length,
                balance: formatCurrency(providerBalance),
              })
            : t("userMenu.accountsCount", {
                count: providerAccounts.length,
              })
          const shouldShowAccountSummary =
            !isExternalWallet &&
            hydrationAccounts.length > 0 &&
            (providerAccounts.length > 1 || hasPositiveBalance)

          return (
            <MenuSelectionItem
              key={type}
              onClick={
                isActiveProvider
                  ? () => openManageWallets(type)
                  : storedRecentAccount
                    ? () => setAccount(storedRecentAccount)
                    : undefined
              }
            >
              <Box sx={{ gridRow: "1 / -1", flexShrink: 0 }}>
                <ProviderLogo size="xl" wallet={wallet} />
              </Box>
              <MenuItemLabel>
                <Flex align="center" gap="s" minWidth={0}>
                  {hasDistinctName ? (
                    <Text truncate={pxToRem(140)}>{accountName}</Text>
                  ) : (
                    shortAddress
                  )}
                  {isActiveProvider && (
                    <Chip size="small" rounded variant="green">
                      {t("userMenu.active")}
                    </Chip>
                  )}
                </Flex>
              </MenuItemLabel>
              {(isExternalWallet || shouldShowAccountSummary) && (
                <MenuItemDescription>
                  {isExternalWallet ? shortAddress : accountSummary}
                </MenuItemDescription>
              )}
              <MenuItemAction>
                <Flex align="center" gap="s">
                  <SHoverActions align="center">
                    <UserMenuChangeAccountButton
                      wallet={wallet}
                      provider={type}
                      accountCount={providerAccounts.length}
                      onCloseMenu={() => onOpenChange(false)}
                    />
                    <ButtonIcon asChild>
                      <CopyButton
                        text={address}
                        title={copyLabel}
                        aria-label={copyLabel}
                      />
                    </ButtonIcon>
                    <ButtonIcon
                      title={disconnectLabel}
                      aria-label={disconnectLabel}
                      onClick={(e) => {
                        e.stopPropagation()
                        disconnect(type)
                      }}
                    >
                      <Icon size="s" component={LogOut} />
                    </ButtonIcon>
                  </SHoverActions>
                </Flex>
              </MenuItemAction>
            </MenuSelectionItem>
          )
        })}

        <MenuSelectionItem
          onClick={() => {
            disconnect()
            onOpenChange(false)
          }}
        >
          <MenuItemIcon sx={{ width: "xl", height: "xl" }} component={LogOut} />
          <MenuItemLabel>{t("userMenu.logOutAll")}</MenuItemLabel>
        </MenuSelectionItem>

        <UserMenuSeparator />

        <MenuSelectionItem onClick={() => openManageWallets()}>
          <MenuItemIcon sx={{ width: "xl", height: "xl" }} component={Plus} />
          <MenuItemLabel>{t("userMenu.manageWallets")}</MenuItemLabel>
        </MenuSelectionItem>
      </HoverCardContent>
    </HoverCard>
  )
}
