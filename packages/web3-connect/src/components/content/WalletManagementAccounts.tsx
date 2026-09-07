import {
  AccountAvatar,
  Box,
  Chip,
  CopyButton,
  Flex,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { formatCurrency, formatNumber } from "@galacticcouncil/utils"
import { useTranslation } from "react-i18next"

import { SChangeAccountButton } from "@/components/account/AccountOption.styled"
import { ShortAddress } from "@/components/account/ShortAddress"
import {
  SAccountModeIcon,
  SAccountTile,
  SAccountTileBalance,
  SAccountTileBody,
  SAccountTileCopyButton,
  SAccountTileRow,
  SSectionLabel,
  SSectionLogo,
  STruncatingRow,
  STruncatingText,
} from "@/components/content/WalletManagementAccounts.styled"
import { getWalletChainModes, getWalletModeIcon } from "@/config/wallet"
import { isEip1193Provider, requestAccounts, toAccount } from "@/utils"
import { isAccountSelected } from "@/utils/accountFilter"
import { getWallet, MetaMask } from "@/wallets"

export type WalletAccount = ReturnType<typeof toAccount> & {
  balance?: number
  /** Present means `balance` is a token amount, absent means fiat. */
  balanceSymbol?: string
  isActive?: boolean
}

export const WalletAccountSection: React.FC<{
  readonly title: string
  readonly logo?: string
  readonly accounts: WalletAccount[]
  readonly currentAccount: WalletAccount | null
  readonly isBalanceLoading: boolean
  readonly onAccountSelect: (account: WalletAccount) => void
}> = ({
  title,
  logo,
  accounts,
  currentAccount,
  isBalanceLoading,
  onAccountSelect,
}) => (
  <Flex direction="column">
    <SSectionLabel gap="xs">
      {logo && <SSectionLogo src={logo} alt="" lazy={false} />}
      <Text fs="p4" fw={500} color={getToken("text.high")} truncate>
        {title}
      </Text>
    </SSectionLabel>
    <Flex direction="column" gap="base">
      {accounts.map((account) => (
        <WalletAccountTile
          key={`${account.publicKey}-${account.provider}`}
          account={account}
          isActive={isAccountSelected(currentAccount, account)}
          isBalanceLoading={isBalanceLoading}
          onClick={() => onAccountSelect(account)}
        />
      ))}
    </Flex>
  </Flex>
)

export const WalletAccountTile: React.FC<{
  readonly account: WalletAccount
  readonly isActive: boolean
  readonly isBalanceLoading: boolean
  readonly onClick: () => void
}> = ({ account, isActive, isBalanceLoading, onClick }) => {
  const { t } = useTranslation()
  const [mode] = getWalletChainModes(account.provider)
  const modeIcon = mode ? getWalletModeIcon(mode) : ""
  const wallet = getWallet(account.provider)
  const metaMaskExtension =
    wallet instanceof MetaMask && isEip1193Provider(wallet.extension)
      ? wallet.extension
      : undefined

  const balanceLabel =
    account.balance === undefined
      ? ""
      : account.balanceSymbol
        ? `${formatNumber(account.balance)} ${account.balanceSymbol}`
        : formatCurrency(account.balance)

  return (
    <Box>
      <SAccountTile
        role="button"
        tabIndex={0}
        data-active={isActive}
        data-has-change-account={!!metaMaskExtension || undefined}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return

          event.preventDefault()
          onClick()
        }}
      >
        <AccountAvatar address={account.displayAddress} size={38} />
        <SAccountTileBody>
          <SAccountTileRow>
            <STruncatingRow gap="xs">
              {modeIcon && (
                <SAccountModeIcon src={modeIcon} alt="" lazy={false} />
              )}
              <Text fs="p4" fw={500} color={getToken("text.high")} truncate>
                {account.name}
              </Text>
              {isActive && (
                <Chip size="small" rounded variant="green">
                  {t("account.active")}
                </Chip>
              )}
            </STruncatingRow>
            <SAccountTileBalance fs="p4" fw={500} color={getToken("text.high")}>
              {isBalanceLoading && account.balance === undefined
                ? ""
                : balanceLabel}
            </SAccountTileBalance>
          </SAccountTileRow>
          <STruncatingRow gap="base" justify="space-between">
            <STruncatingText
              fs="p5"
              color={getToken("text.medium")}
              font="mono"
              fw={500}
              truncate
            >
              <ShortAddress address={account.displayAddress} length={12} />
            </STruncatingText>
            <SAccountTileCopyButton
              asChild
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <CopyButton
                aria-label={t("addressBook.copyAddress")}
                text={account.displayAddress}
                iconSize="xs"
              />
            </SAccountTileCopyButton>
          </STruncatingRow>
        </SAccountTileBody>
      </SAccountTile>
      {metaMaskExtension && (
        <SChangeAccountButton
          isActive={isActive}
          variant="muted"
          size="small"
          onClick={(event) => {
            event.stopPropagation()
            requestAccounts(metaMaskExtension)
          }}
        >
          {t("account.changeAccount")}
        </SChangeAccountButton>
      )}
    </Box>
  )
}
