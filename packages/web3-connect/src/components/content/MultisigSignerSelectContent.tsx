import { ModalBody, ModalHeader } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { MultisigSignerSelect } from "@/components/multisig/MultisigSignerSelect"
import { Web3ConnectModalPage } from "@/config/modal"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"

export const MultisigSignerSelectContent = () => {
  const { t } = useTranslation()
  const { setPage } = useWeb3ConnectContext()

  return (
    <>
      <ModalHeader
        title={t("multisig.signerSelect.title")}
        description={t("multisig.signerSelect.description")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody scrollable>
        <MultisigSignerSelect />
      </ModalBody>
    </>
  )
}
