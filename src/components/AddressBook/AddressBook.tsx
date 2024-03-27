import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { safeConvertAddressSS58 } from "utils/formatting"
import { SContainer, SHeader, SItems } from "./AddressBook.styled"
import { useAddressStore } from "./AddressBook.utils"
import { AddressBookEmpty } from "./empty/AddressBookEmpty"
import { AddressBookInput } from "./input/AddressBookInput"
import { AddressBookItem } from "./item/AddressBookItem"
import { safeConvertAddressH160 } from "utils/evm"
import { arraySearch } from "utils/helpers"

type Props = { onSelect: (address: string) => void }

export const AddressBook = ({ onSelect }: Props) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const { addresses } = useAddressStore()

  const items = useMemo(
    () => (search ? arraySearch(addresses, search) : addresses),
    [addresses, search],
  )

  const isValidAddress =
    safeConvertAddressSS58(search, 0) !== null ||
    safeConvertAddressH160(search) !== null

  const canAdd = !!search && !items.length && isValidAddress

  return (
    <SContainer>
      <AddressBookInput
        search={search}
        onChange={setSearch}
        onAdd={() => setSearch("")}
        canAdd={canAdd}
      />
      <Spacer size={14} />
      {!items.length ? (
        <AddressBookEmpty canAdd={canAdd} />
      ) : (
        <SItems>
          <SHeader>
            <Text fs={11} lh={16} color="basic700">
              {t("addressbook.list.account")}
            </Text>
            <Text fs={11} lh={16} color="basic700">
              {t("addressbook.list.address")}
            </Text>
          </SHeader>
          {items.map((address) => (
            <AddressBookItem
              key={address.address}
              {...address}
              onSelect={onSelect}
            />
          ))}
        </SItems>
      )}
    </SContainer>
  )
}
