import { ModalBody, ModalHeader } from "@galacticcouncil/ui/components"
import { useState } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AddressBookModal } from "@/components/address-book"
import { ExternalWalletForm } from "@/components/external/ExternalWalletForm"
import { useExternalWalletForm } from "@/components/external/ExternalWalletForm.form"
import { Web3ConnectModalPage } from "@/config/modal"
import { WalletMode } from "@/config/wallet"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"

export const ExternalWalletContent = () => {
  const { t } = useTranslation()
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false)
  const form = useExternalWalletForm()
  const { setPage } = useWeb3ConnectContext()

  if (isAddressBookOpen) {
    return (
      <AddressBookModal
        whitelist={[WalletMode.Substrate, WalletMode.EVM]}
        onBack={() => setIsAddressBookOpen(false)}
        onSelect={(address) => {
          form.setValue("address", address.address, { shouldValidate: true })
          setIsAddressBookOpen(false)
        }}
      />
    )
  }

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("external.viewAccount")}
        description={t("external.description")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody>
        <ExternalWalletForm
          onAddressBookOpen={() => setIsAddressBookOpen(true)}
        />
      </ModalBody>
    </FormProvider>
  )
}
