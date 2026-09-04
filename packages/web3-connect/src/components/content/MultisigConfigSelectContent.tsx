import { Plus } from "@galacticcouncil/ui/assets/icons"
import {
  Alert,
  Button,
  Grid,
  Icon,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@galacticcouncil/ui/components"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { AccountMultisigOption } from "@/components/account/AccountMultisigOption"
import { Web3ConnectModalPage } from "@/config/modal"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useMultisigConfigs } from "@/hooks/useMultisigConfigs"
import { MultisigConfig, useMultisigStore } from "@/hooks/useMultisigStore"

export const MultisigConfigSelectContent = () => {
  const { t } = useTranslation()
  const { setPage } = useWeb3ConnectContext()
  const { setActive, remove, add, update } = useMultisigStore(
    useShallow(pick(["setActive", "remove", "add", "update"])),
  )
  const configs = useMultisigConfigs()

  const handleMultisigSelect = useCallback(
    (config: MultisigConfig) => {
      setActive(config.id, null)
      setPage(Web3ConnectModalPage.MultisigSignerSelect)
    },
    [setActive, setPage],
  )

  const handleRename = useCallback(
    (config: MultisigConfig, newName: string) => {
      const trimmed = newName.trim().slice(0, 32)
      if (config.isCustom) {
        update(config.id, { name: trimmed })
        return
      }
      add({
        address: config.address,
        name: trimmed,
        signers: config.signers,
        threshold: config.threshold,
        isCustom: true,
      })
    },
    [add, update],
  )

  return (
    <>
      <ModalHeader
        title={t("multisig.configSelect.title")}
        align="center"
        onBack={() => setPage(Web3ConnectModalPage.Wallets)}
      />
      <ModalBody scrollable>
        <Grid gap="base">
          {configs.map((config) => (
            <AccountMultisigOption
              key={config.id}
              config={config}
              onSelect={handleMultisigSelect}
              onRename={handleRename}
              onDelete={remove}
            />
          ))}
          {!configs.length && (
            <Alert
              variant="info"
              title={t("multisig.configSelect.empty.title")}
              description={t("multisig.configSelect.empty.description")}
            />
          )}
        </Grid>
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
