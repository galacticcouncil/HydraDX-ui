import { ModalHeader, ScrollArea, Stack } from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { stringEquals } from "@galacticcouncil/utils"
import { FC, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { filter, pipe, sortBy } from "remeda"

import { AccountFilter } from "@/components/account/AccountFilter"
import { AccountRemoveModal } from "@/components/account/AccountRemoveModal"
import {
  Address,
  useAddresses,
  useAddressStore,
} from "@/components/address-book/AddressBook.store"
import {
  AddressBookEmptyState,
  AddressBookEmptyStateReason,
} from "@/components/address-book/AddressBookEmptyState"
import { AddressBookEntry } from "@/components/address-book/AddressBookEntry"
import {
  SAddressBookModalBody,
  SAddressBookModalContent,
  SAddressBookModalControls,
} from "@/components/address-book/AddressBookModal.styled"
import { AddressBookSearch } from "@/components/address-book/AddressBookSearch"
import {
  WALLET_ACCOUNT_FILTER_OPTIONS,
  WalletAccountFilterOption,
  WalletAccountFilterOptionOverride,
  WalletMode,
} from "@/config/wallet"
import i18n from "@/i18n"
import { addressToPublicKey } from "@/utils/publicKey"
import { getWalletModeByAddress, getWalletModeName } from "@/utils/wallet"

type Props = {
  readonly header?: React.ReactNode
  readonly onBack?: () => void
  readonly align?: "default" | "center"
  readonly whitelist?: ReadonlyArray<WalletAccountFilterOptionOverride>
  readonly excludePublicKeys?: ReadonlyArray<string>
  readonly onSelect?: (address: Address) => void
}

const MAX_VISIBLE_ADDRESS_BOOK_ENTRIES = 6

const defaultWhitelist = WALLET_ACCOUNT_FILTER_OPTIONS.filter(
  (option) => option !== WalletMode.SubstrateH160,
)

export const AddressBookModal: FC<Props> = ({
  header,
  onBack,
  align = "default",
  whitelist = defaultWhitelist,
  excludePublicKeys,
  onSelect,
}) => {
  const { t } = useTranslation("translations", { i18n })
  const [publicKeyToRemove, setPublicKeyToRemove] = useState("")
  const [searchPhrase, setSearchPhrase] = useState("")

  const [accountFilter, setAccountFilter] = useState<WalletAccountFilterOption>(
    whitelist.length === 1
      ? (whitelist[0] ?? WalletMode.Default)
      : WalletMode.Default,
  )

  const { isMobile } = useBreakpoints()
  const { add, edit, remove } = useAddressStore()
  const allAddresses = useAddresses()

  const availableAccountModes = new Set(
    allAddresses.map((address) => address.mode),
  )
  const accountFilterWhitelist = whitelist.filter((mode) =>
    availableAccountModes.has(mode),
  )

  const addressOrder = new Map(
    allAddresses.map((address, index) => [address.publicKey, index]),
  )

  const filteredAddresses = pipe(
    allAddresses,
    filter(
      (address) =>
        !excludePublicKeys?.some((key) => stringEquals(key, address.publicKey)),
    ),
    filter((address) =>
      accountFilter === WalletMode.Default
        ? whitelist.includes(address.mode)
        : address.mode === accountFilter,
    ),
    sortBy(
      [(address) => address.isCustom || false, "desc"],
      [(address) => addressOrder.get(address.publicKey) ?? 0, "desc"],
    ),
  )

  const searchedAddresses = filteredAddresses.filter(
    (address) =>
      address.name.toLowerCase().includes(searchPhrase.toLowerCase()) ||
      address.address.toLowerCase().includes(searchPhrase.toLowerCase()) ||
      address.publicKey.toLowerCase().includes(searchPhrase.toLowerCase()),
  )

  const addressProvider = getWalletModeByAddress(searchPhrase)
  const addressPublicKey = addressToPublicKey(searchPhrase)

  const canAdd =
    !searchedAddresses.length &&
    !!addressProvider &&
    !allAddresses.find((address) =>
      stringEquals(address.publicKey, addressPublicKey),
    ) &&
    whitelist.includes(addressProvider)

  const emptyStateReason = ((): AddressBookEmptyStateReason => {
    const hasSearch = searchPhrase.trim().length > 0

    if (hasSearch) {
      return canAdd
        ? AddressBookEmptyStateReason.SearchNotInList
        : AddressBookEmptyStateReason.SearchNoResults
    }

    if (allAddresses.length === 0) {
      return AddressBookEmptyStateReason.NoContacts
    }

    return AddressBookEmptyStateReason.NoFilterContacts
  })()

  const emptyStateFilterName =
    accountFilter !== WalletMode.Default
      ? getWalletModeName(accountFilter)
      : undefined

  const selectTitle =
    accountFilter === WalletMode.Default
      ? t("addressBook.selectAccount")
      : t("addressBook.selectModeAccount", {
          mode: getWalletModeName(accountFilter),
        })

  useEffect(() => {
    if (
      accountFilter !== WalletMode.Default &&
      !accountFilterWhitelist.includes(accountFilter)
    ) {
      setAccountFilter(WalletMode.Default)
    }
  }, [accountFilter, accountFilterWhitelist])

  const scrollAreaHeight =
    searchedAddresses.length <= MAX_VISIBLE_ADDRESS_BOOK_ENTRIES
      ? "auto"
      : "45vh"

  if (publicKeyToRemove) {
    return (
      <AccountRemoveModal
        align={align}
        onDelete={() => {
          remove(publicKeyToRemove)
          setPublicKeyToRemove("")
        }}
        onCancel={() => setPublicKeyToRemove("")}
        onBack={() => setPublicKeyToRemove("")}
      />
    )
  }

  const addNewAddress = (): void => {
    if (!canAdd) {
      return
    }

    add({
      address: searchPhrase,
      name: "",
      isCustom: true,
      isGlobal: true,
    })

    setSearchPhrase("")

    if (accountFilter !== addressProvider) {
      setAccountFilter(WalletMode.Default)
    }
  }

  return (
    <>
      {header ??
        (onBack && (
          <ModalHeader title={selectTitle} align={align} onBack={onBack} />
        ))}
      <SAddressBookModalBody scrollable={false} isMobile={isMobile}>
        <SAddressBookModalControls>
          <AddressBookSearch
            canAdd={canAdd}
            searchPhrase={searchPhrase}
            onSearchPhraseChange={setSearchPhrase}
            onAdd={addNewAddress}
          />
          {accountFilterWhitelist.length > 1 && (
            <AccountFilter
              active={accountFilter}
              whitelist={accountFilterWhitelist}
              onSetActive={setAccountFilter}
            />
          )}
        </SAddressBookModalControls>
        <SAddressBookModalContent isMobile={isMobile}>
          {searchedAddresses.length === 0 ? (
            <AddressBookEmptyState
              reason={emptyStateReason}
              filterName={emptyStateFilterName}
              {...(canAdd && {
                address: searchPhrase,
                addressMode: addressProvider,
                onAdd: addNewAddress,
              })}
            />
          ) : (
            <ScrollArea height={isMobile ? "100%" : scrollAreaHeight}>
              <Stack separated>
                {searchedAddresses.map((address) => (
                  <AddressBookEntry
                    key={address.publicKey}
                    {...address}
                    {...(onSelect && { onSelect: () => onSelect(address) })}
                    {...(address.isCustom && {
                      onEdit: (name: string) => {
                        edit({
                          ...address,
                          name,
                        })
                      },
                      onDelete: () => setPublicKeyToRemove(address.publicKey),
                    })}
                  />
                ))}
              </Stack>
            </ScrollArea>
          )}
        </SAddressBookModalContent>
      </SAddressBookModalBody>
    </>
  )
}
