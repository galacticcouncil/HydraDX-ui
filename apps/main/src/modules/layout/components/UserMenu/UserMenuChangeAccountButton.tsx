import { ButtonIcon, Icon } from "@galacticcouncil/ui/components"
import {
  useWeb3ConnectModal,
  Web3ConnectModalPage,
} from "@galacticcouncil/web3-connect"
import { WalletProviderType } from "@galacticcouncil/web3-connect/src/config/providers"
import {
  isEip1193Provider,
  requestAccounts,
} from "@galacticcouncil/web3-connect/src/utils"
import { getWallet, MetaMask } from "@galacticcouncil/web3-connect/src/wallets"
import { RefreshCw } from "lucide-react"
import { FC } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  readonly wallet: NonNullable<ReturnType<typeof getWallet>>
  readonly provider: WalletProviderType
  readonly accountCount: number
  readonly onCloseMenu: () => void
}

export const UserMenuChangeAccountButton: FC<Props> = ({
  wallet,
  provider,
  accountCount,
  onCloseMenu,
}) => {
  const { t } = useTranslation()
  const { toggle } = useWeb3ConnectModal()
  const label = t("userMenu.changeAccount")

  const metaMask =
    wallet instanceof MetaMask && isEip1193Provider(wallet.extension)
      ? wallet.extension
      : null

  const changeAccount = metaMask
    ? () => requestAccounts(metaMask)
    : provider === WalletProviderType.ExternalWallet
      ? () => {
          onCloseMenu()
          toggle(undefined, {
            initialPage: Web3ConnectModalPage.ExternalWallet,
          })
        }
      : accountCount > 1
        ? () => {
            onCloseMenu()
            toggle(undefined, { initialProvider: provider })
          }
        : null

  if (!changeAccount) return null

  return (
    <ButtonIcon
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        changeAccount()
      }}
    >
      <Icon size="s" component={RefreshCw} />
    </ButtonIcon>
  )
}
