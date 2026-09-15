import {
  AccountAvatar,
  Box,
  EditableText,
  Flex,
  Skeleton,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { formatCurrency, formatNumber } from "@galacticcouncil/utils"

import { SAccountActionCopyButton } from "@/components/account/AccountActionButton.styled"
import { AccountDeleteButton } from "@/components/account/AccountDeleteButton"
import { SAccountOption } from "@/components/account/AccountOption.styled"
import { ShortAddress } from "@/components/account/ShortAddress"
import { ProviderLogo } from "@/components/provider/ProviderLogo"
import { WalletProviderType } from "@/config/providers"
import { WalletMode } from "@/config/wallet"
import { Account } from "@/hooks/useWeb3Connect"
import { getWalletModeIcon } from "@/utils/wallet"
import { getWallet } from "@/wallets"

export type AccountOptionProps = Omit<
  Account,
  "provider" | "canUseOnHydration"
> & {
  provider?: WalletProviderType
  mode?: WalletMode
  className?: string
  isActive?: boolean
  isProxy?: boolean
  isBalanceLoading?: boolean
  balanceSymbol?: string
  nameBadge?: React.ReactNode
  onSelect?: (account: Account) => void
  onEdit?: (name: string) => void
  onDelete?: () => void
}

export const AccountOption: React.FC<AccountOptionProps> = ({
  className,
  isActive,
  isProxy = false,
  balance,
  nameBadge,
  balanceSymbol,
  isBalanceLoading,
  onSelect,
  onEdit,
  onDelete,
  ...account
}) => {
  const wallet = getWallet(account.provider)

  const modeIcon = account.mode ? getWalletModeIcon(account.mode) : ""

  return (
    <SAccountOption
      className={className}
      data-active={isActive}
      data-proxy={isProxy}
      {...(onSelect
        ? {
            onClick: () => onSelect(account as Account),
          }
        : {
            disabled: true,
          })}
    >
      <Flex align="center" gap="m">
        <Box sx={{ flexShrink: 0 }}>
          <AccountAvatar address={account.displayAddress} />
        </Box>
        <Flex direction="column" width="100%" sx={{ minWidth: 0 }}>
          <Flex align="center" justify="space-between" height="l">
            <Flex align="center" gap="s" sx={{ minWidth: 0 }}>
              {wallet ? (
                <ProviderLogo size="xs" wallet={wallet} />
              ) : (
                modeIcon && <img sx={{ size: "xs" }} src={modeIcon} />
              )}
              {onEdit ? (
                <Box sx={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                  <EditableText
                    fs="p3"
                    truncate={200}
                    value={account.name}
                    onChange={onEdit}
                  />
                </Box>
              ) : (
                <Text fs="p3" truncate={200}>
                  {account.name}
                </Text>
              )}
              {nameBadge}
            </Flex>
            {isBalanceLoading && balance === undefined ? (
              <Skeleton sx={{ width: 75, ml: "auto" }} />
            ) : (
              balance !== undefined && (
                <Text fs="p3">
                  {balanceSymbol
                    ? `${formatNumber(balance)} ${balanceSymbol}`
                    : formatCurrency(balance)}
                </Text>
              )
            )}
          </Flex>
          <Flex align="center" justify="space-between" gap="s">
            <Text fs="p4" color={getToken("text.medium")} sx={{ minWidth: 0 }}>
              <Text as="span" truncate display={["none", "block"]}>
                <ShortAddress address={account.displayAddress} />
              </Text>
              <Text as="span" display={["block", "none"]}>
                <ShortAddress address={account.displayAddress} length={12} />
              </Text>
            </Text>
            <Flex pl="m" ml="auto" gap="base">
              <SAccountActionCopyButton text={account.displayAddress} />
              {onDelete && <AccountDeleteButton onClick={onDelete} />}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </SAccountOption>
  )
}
