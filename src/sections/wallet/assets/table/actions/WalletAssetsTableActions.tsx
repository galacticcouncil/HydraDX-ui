import TradeIcon from "assets/icons/Fill.svg?react"
import ChevronDownIcon from "assets/icons/ChevronDown.svg?react"
import MoreIcon from "assets/icons/MoreDotsIcon.svg?react"
import TransferIcon from "assets/icons/TransferIcon.svg?react"
import MetamaskLogo from "assets/icons/MetaMask.svg?react"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import DollarIcon from "assets/icons/DollarIcon.svg?react"
import { ButtonTransparent } from "components/Button/Button"
import { Dropdown, TDropdownItem } from "components/Dropdown/Dropdown"
import { TableAction } from "components/Table/Table"
import { useTranslation } from "react-i18next"
import { theme } from "theme"
import { isNotNil } from "utils/helpers"
import { useSetAsFeePayment } from "api/payments"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { isMetaMask, watchAsset } from "utils/metamask"
import { NATIVE_EVM_ASSET_SYMBOL, isEvmAccount } from "utils/evm"
import { useVisibleElements } from "hooks/useVisibleElements"
import { LINKS } from "utils/navigation"
import { useNavigate } from "@tanstack/react-location"
import { AssetsTableData } from "sections/wallet/assets/table/WalletAssetsTable.utils"

type Props = {
  toggleExpanded: () => void
  onTransferClick: () => void
  isExpanded: boolean
  asset: AssetsTableData
}

export const WalletAssetsTableActions = (props: Props) => {
  const { t } = useTranslation()
  const setFeeAsPayment = useSetAsFeePayment()
  const { account } = useAccount()

  const navigate = useNavigate()

  const { hiddenElementsKeys, observe } = useVisibleElements<HTMLDivElement>()

  const {
    id,
    symbol,
    decimals,
    couldBeSetAsPaymentFee,
    tradability: { inTradeRouter, canBuy },
  } = props.asset

  const enablePaymentFee =
    couldBeSetAsPaymentFee && !isEvmAccount(account?.address)

  const couldWatchMetaMaskAsset =
    isMetaMask(window?.ethereum) &&
    isEvmAccount(account?.address) &&
    symbol !== NATIVE_EVM_ASSET_SYMBOL

  const onFeePaymentSelect = () => setFeeAsPayment(id)

  const buttons: TDropdownItem[] = [
    {
      key: "trade",
      icon: <TradeIcon />,
      label: t("wallet.assets.table.actions.trade"),
      onSelect: inTradeRouter
        ? () =>
            navigate({
              to: "/trade/swap",
              search: canBuy ? { assetOut: id } : { assetIn: id },
            })
        : undefined,
      disabled: !inTradeRouter || account?.isExternalWalletConnected,
    },
    {
      key: "transfer",
      icon: <TransferIcon />,
      label: t("wallet.assets.table.actions.transfer"),
      onSelect: () => props.onTransferClick(),
      disabled: account?.isExternalWalletConnected,
    },
    {
      key: "deposit",
      icon: <PlusIcon />,
      label: t("wallet.assets.table.actions.deposit"),
      onSelect: () => navigate({ to: LINKS.cross_chain }),
      disabled: account?.isExternalWalletConnected,
    },
  ]

  const actionItems = [
    enablePaymentFee
      ? {
          key: "setAsFeePayment",
          icon: <DollarIcon />,
          label: t("wallet.assets.table.actions.payment.asset"),
          onSelect: () => onFeePaymentSelect(),
        }
      : null,
    couldWatchMetaMaskAsset
      ? {
          key: "watch",
          icon: <MetamaskLogo width={18} height={18} />,
          label: t("wallet.assets.table.actions.watch"),
          onSelect: () =>
            watchAsset(window?.ethereum, id, {
              symbol: symbol,
              decimals: decimals,
            }),
        }
      : null,
  ].filter(isNotNil)

  return (
    <div
      sx={{
        flex: "row",
        gap: 10,
        justify: "end",
      }}
    >
      <div
        sx={{
          flex: "row",
          gap: 10,
          flexWrap: "wrap",
          height: 38,
          justify: "end",
        }}
        css={{ overflow: "hidden" }}
        ref={observe}
      >
        {buttons.map((button) => (
          <TableAction
            key={button.key}
            icon={button.icon}
            onClick={button.onSelect}
            disabled={button.disabled}
            data-intersect={button.key}
          >
            {button.label}
          </TableAction>
        ))}
      </div>
      <Dropdown
        items={
          account?.isExternalWalletConnected
            ? []
            : [
                ...buttons.filter((button) =>
                  hiddenElementsKeys.includes(button.key),
                ),
                ...actionItems,
              ]
        }
        onSelect={(item) => item.onSelect?.()}
      >
        <MoreIcon />
      </Dropdown>

      <ButtonTransparent
        onClick={props.toggleExpanded}
        css={{
          color: theme.colors.iconGray,
          opacity: props.isExpanded ? "1" : "0.5",
          transform: props.isExpanded ? "rotate(180deg)" : undefined,
        }}
      >
        <ChevronDownIcon />
      </ButtonTransparent>
    </div>
  )
}
