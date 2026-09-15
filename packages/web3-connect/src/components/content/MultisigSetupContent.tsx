import { ModalBody, ModalHeader } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { MultisigSetupPanel } from "@/components/multisig/MultisigSetupPanel"
import { Web3ConnectModalPage } from "@/config/modal"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"

export const MultisigSetupContent = () => {
  const { t } = useTranslation()
  const { setPage } = useWeb3ConnectContext()

  return (
    <>
      <ModalHeader
        title={t("multisig.setup.title")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody scrollable={false} noPadding>
        <MultisigSetupPanel
          onContinue={() => setPage(Web3ConnectModalPage.MultisigSignerSelect)}
        />
      </ModalBody>
    </>
  )
}
