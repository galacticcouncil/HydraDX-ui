import SettingsIcon from "assets/icons/SettingsIcon.svg?react"
import { IconButton } from "components/IconButton/IconButton"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { SettingsContents } from "components/Layout/Header/toolbar/buttons/Settings"
import { theme } from "theme"
import { useSettingsStore } from "state/store"
import { DegenModeModal } from "components/Layout/Header/DegenMode/DegenModeModal"

export const HeaderSettingsMobile = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [degenModalOpen, setDegenModalOpen] = useState(false)
  const { degenMode, toggleDegenMode } = useSettingsStore()

  const onDegenModalClose = () => setDegenModalOpen(false)
  const onDegenModalAccept = () => {
    toggleDegenMode()
    setDegenModalOpen(false)
  }

  return (
    <>
      <div sx={{ flex: "row", align: "center", gap: 10 }}>
        <IconButton
          size={34}
          onClick={() => setOpen(true)}
          icon={<SettingsIcon />}
          css={{
            border: "none",
            color: theme.colors.brightBlue100,
            background: `rgba(${theme.rgbColors.darkBlue401}, 0.8)`,
          }}
          round
        />
        <Text fs={12} fw={500} color="brightBlue200">
          {t("header.settings.title")}
        </Text>
      </div>
      <Modal open={open}>
        <SettingsContents
          onClose={() => setOpen(false)}
          onDegenModeChange={() => {
            if (degenMode) {
              toggleDegenMode()
            } else {
              setDegenModalOpen(true)
            }
          }}
        />
      </Modal>
      {degenModalOpen && (
        <DegenModeModal
          open={degenModalOpen}
          onClose={onDegenModalClose}
          onAccept={onDegenModalAccept}
        />
      )}
    </>
  )
}
