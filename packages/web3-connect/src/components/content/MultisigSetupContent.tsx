import { ModalBody, ModalHeader } from "@galacticcouncil/ui/components"
import { useMemo } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useMultisigSetupForm } from "@/components/multisig/MultisigSetup.form"
import { MultisigSetupNew } from "@/components/multisig/MultisigSetupNew"
import { Web3ConnectModalPage } from "@/config/modal"
import { SUBSTRATE_PROVIDERS } from "@/config/providers"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useWeb3Connect } from "@/hooks/useWeb3Connect"

export const MultisigSetupContent = () => {
  const { t } = useTranslation()
  const { setPage } = useWeb3ConnectContext()
  const { account } = useWeb3Connect()

  const defaultSignerAddress = useMemo(() => {
    if (
      account &&
      !account.isMultisig &&
      SUBSTRATE_PROVIDERS.includes(account.provider)
    ) {
      return account.address
    }
    return undefined
  }, [account])

  const form = useMultisigSetupForm({ defaultSignerAddress })

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("multisig.setup.title")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody scrollable={false} noPadding>
        <MultisigSetupNew
          isSignerPrefilled={!!defaultSignerAddress}
          onContinue={() => setPage(Web3ConnectModalPage.MultisigSignerSelect)}
        />
      </ModalBody>
    </FormProvider>
  )
}
