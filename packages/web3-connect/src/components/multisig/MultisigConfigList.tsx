import { Alert, Grid } from "@galacticcouncil/ui/components"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { AccountMultisigOption } from "@/components/account/AccountMultisigOption"
import { useMultisigConfigs } from "@/hooks/useMultisigConfigs"
import { MultisigConfig, useMultisigStore } from "@/hooks/useMultisigStore"

/**
 * The saved-multisig list, rendered both as its own modal page and inside the
 * wallet-management right column - the two entry points differ only in chrome.
 */
export const MultisigConfigList: React.FC<{
  /** Runs after the picked config is made active, to show the signer step. */
  readonly onSelected: () => void
}> = ({ onSelected }) => {
  const { t } = useTranslation()
  const { setActive, remove, add, update } = useMultisigStore(
    useShallow(pick(["setActive", "remove", "add", "update"])),
  )
  const configs = useMultisigConfigs()

  const handleMultisigSelect = useCallback(
    (config: MultisigConfig) => {
      setActive(config.id, null)
      onSelected()
    },
    [onSelected, setActive],
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
  )
}
