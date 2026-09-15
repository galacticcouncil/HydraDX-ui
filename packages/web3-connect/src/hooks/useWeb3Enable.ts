import { useMutation } from "@tanstack/react-query"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import {
  AddressInput,
  useAddressStore,
} from "@/components/address-book/AddressBook.store"
import { WalletProviderType } from "@/config/providers"
import { useWeb3Connect, WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { BaseWalletError, UserRejectedError } from "@/utils/errors"
import { toStoredAccount } from "@/utils/wallet"
import { getWallet } from "@/wallets"

type UseWeb3EnableOptions = {
  disconnectOnError?: boolean
  eager?: boolean
}

const ADDRESS_BOOK_PROVIDER_BLACKLIST = [
  WalletProviderType.ExternalWallet,
  WalletProviderType.WalletConnect,
]

export const useWeb3Enable = (options: UseWeb3EnableOptions = {}) => {
  const { setStatus, setError, disconnect, setAccounts, markRecent } =
    useWeb3Connect(
      useShallow(
        pick([
          "setStatus",
          "setError",
          "disconnect",
          "setAccounts",
          "markRecent",
        ]),
      ),
    )

  const { add: addToAddressBook } = useAddressStore()

  const { mutateAsync: enable, ...mutation } = useMutation({
    mutationFn: async (type: WalletProviderType) => {
      const wallet = getWallet(type)
      if (!wallet) return []
      await wallet.enable()
      return wallet.getAccounts()
    },
    retry: false,
    onMutate: (type) => setStatus(type, WalletProviderStatus.Pending),
    onSuccess: (data, type) => {
      setAccounts(data.map(toStoredAccount), type)
      setStatus(type, WalletProviderStatus.Connected)
      if (!options.eager) markRecent(type)

      const addresses = data
        .map(
          (account): AddressInput => ({
            address: account.address,
            name: account.name,
            provider: account.provider,
          }),
        )
        .filter(
          ({ provider }) =>
            provider !== undefined &&
            !ADDRESS_BOOK_PROVIDER_BLACKLIST.includes(provider),
        )

      addToAddressBook(addresses)
    },
    onError: (error, type) => {
      if (options.disconnectOnError || error instanceof UserRejectedError) {
        return disconnect(type)
      }

      setStatus(type, WalletProviderStatus.Error)
      const errorMessage =
        error instanceof BaseWalletError
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : "Unexpected error, please try again."
      setError(errorMessage)
    },
  })

  return {
    enable,
    disconnect,
    ...mutation,
  }
}
