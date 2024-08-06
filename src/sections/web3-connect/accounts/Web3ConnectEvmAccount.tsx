import { useNavigate, useSearch } from "@tanstack/react-location"
import { Button } from "components/Button/Button"
import { ComponentPropsWithoutRef, FC } from "react"
import { useTranslation } from "react-i18next"
import { useWallet } from "sections/web3-connect/Web3Connect.utils"
import { Web3ConnectAccount } from "sections/web3-connect/accounts/Web3ConnectAccount"
import { SAccountItem } from "sections/web3-connect/accounts/Web3ConnectAccount.styled"
import { Web3ConnectAccountSelect } from "sections/web3-connect/accounts/Web3ConnectAccountSelect"
import { useWeb3ConnectStore } from "sections/web3-connect/store/useWeb3ConnectStore"
import { isMetaMask, isMetaMaskLike, requestAccounts } from "utils/metamask"

export const Web3ConnectEvmAccount: FC<
  ComponentPropsWithoutRef<typeof Web3ConnectAccount>
> = ({ balance, ...account }) => {
  const { t } = useTranslation()
  const {
    account: currentAccount,
    setAccount,
    toggle,
    provider,
  } = useWeb3ConnectStore()
  const { wallet } = useWallet()
  const navigate = useNavigate()
  const search = useSearch()

  const isActive = currentAccount?.address === account.address

  // Allow account changing for MetaMask wallets,
  // but disable for MetaMask-like as it doesn't provide a way to open the account selection programmatically
  const shouldAllowAccountChange =
    isMetaMask(wallet?.extension) && !isMetaMaskLike(wallet?.extension)

  return (
    <>
      <SAccountItem
        isActive={isActive}
        onClick={() => {
          setAccount(account)
          toggle()
          if (search.account) navigate({ search: { account: undefined } })
        }}
      >
        <Web3ConnectAccountSelect
          address={account.displayAddress ?? ""}
          balance={balance}
          provider={provider}
          name={account.name}
          isActive={isActive}
        />
      </SAccountItem>
      {shouldAllowAccountChange && (
        <Button
          variant="outline"
          fullWidth
          size="small"
          onClick={() => requestAccounts(wallet?.extension)}
        >
          {t("walletConnect.accountSelect.change")}
        </Button>
      )}
    </>
  )
}
