import { AccountInput, Flex, Label, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC, useId } from "react"
import { useTranslation } from "react-i18next"

import { AddressBookButton } from "@/components/address-book/AddressBookButton"
import i18n from "@/i18n"

export type AddressBookProps = {
  readonly address: string
  readonly error?: string
  readonly onAddressChange: (address: string) => void
  readonly onOpenMyContacts: () => void
}

export const AddressBook: FC<AddressBookProps> = ({
  address,
  error,
  onAddressChange,
  onOpenMyContacts,
}) => {
  const { t } = useTranslation("translations", { i18n })
  const id = useId()

  return (
    <Flex py="xl" direction="column" justify="flex-end">
      <Flex direction="column" gap="m">
        <Flex justify="space-between" align="center">
          <Label
            fw={500}
            fs="p5"
            lh={1.2}
            color={getToken("text.medium")}
            htmlFor={id}
          >
            {t("addressBook.destinationAddress")}
          </Label>
          <AddressBookButton onClick={onOpenMyContacts} />
        </Flex>
        <AccountInput
          id={id}
          value={address}
          onChange={onAddressChange}
          placeholder={t("addressBook.placeholder")}
          isError={!!error}
        />
      </Flex>
      {error && (
        <Text
          font="secondary"
          fw={400}
          fs="p5"
          lh={1}
          color={getToken("accents.danger.secondary")}
          ml="auto"
        >
          {error}
        </Text>
      )}
    </Flex>
  )
}
