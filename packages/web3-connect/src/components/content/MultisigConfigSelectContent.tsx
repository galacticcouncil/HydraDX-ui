import { Plus } from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  Icon,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { MultisigConfigList } from "@/components/multisig/MultisigConfigList"
import { Web3ConnectModalPage } from "@/config/modal"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"

export const MultisigConfigSelectContent = () => {
  const { t } = useTranslation()
  const { setPage } = useWeb3ConnectContext()

  return (
    <>
      <ModalHeader
        title={t("multisig.configSelect.title")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody scrollable>
        <MultisigConfigList
          onSelected={() => setPage(Web3ConnectModalPage.MultisigSignerSelect)}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          variant="accent"
          outline
          size="large"
          width="100%"
          type="button"
          onClick={() => setPage(Web3ConnectModalPage.MultisigSetup)}
        >
          <Icon size="s" component={Plus} />
          {t("multisig.configSelect.setupNew")}
        </Button>
      </ModalFooter>
    </>
  )
}
