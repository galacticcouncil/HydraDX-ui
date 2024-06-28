import { Root, Trigger } from "@radix-ui/react-dropdown-menu"
import IconDollar from "assets/icons/IconDollarLarge.svg?react"
import ApeIcon from "assets/icons/ApeIcon.svg?react"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { HeaderDropdown } from "components/Layout/Header/HeaderDropdown/HeaderDropdown"
import { HeaderDropdownItems } from "components/Layout/Header/HeaderDropdown/HeaderDropdownItems"
import { HeaderDropdownItem } from "components/Layout/Header/HeaderDropdown/HeaderDropdownItem"
import {
  SToolbarButton,
  SToolbarIcon,
} from "components/Layout/Header/toolbar/HeaderToolbar.styled"
import { HeaderSettingsDisplayAsset } from "components/Layout/Header/settings/displayAsset/HeaderSettingsDisplayAsset"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import SettingsIcon from "assets/icons/SettingsIcon.svg?react"
import { useSettingsStore } from "state/store"
import { Separator } from "components/Separator/Separator"
import { DegenModeModal } from "components/Layout/Header/DegenMode/DegenModeModal"

export const Settings = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [degenModalOpen, setDegenModalOpen] = useState(false)
  const { degenMode, toggleDegenMode } = useSettingsStore()

  const onClose = () => setOpen(false)
  const onDegenModalClose = () => setDegenModalOpen(false)
  const onDegenModalAccept = () => {
    setDegenModalOpen(false)
    toggleDegenMode()
  }

  return (
    <>
      <Root open={open} onOpenChange={setOpen} modal={false}>
        <InfoTooltip text={t("header.settings.title")} type="black" asChild>
          <div>
            <SToolbarButton as={Trigger}>
              <SToolbarIcon
                as={SettingsIcon}
                aria-label={t("header.settings.title")}
              />
            </SToolbarButton>
          </div>
        </InfoTooltip>
        <HeaderDropdown open={open}>
          <SettingsContents
            onClose={onClose}
            onDegenModeChange={() => {
              if (degenMode) {
                toggleDegenMode()
              } else {
                setDegenModalOpen(true)
              }
            }}
          />
        </HeaderDropdown>
      </Root>
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

export const SettingsContents = ({
  onClose,
  onDegenModeChange,
}: {
  onClose: () => void
  onDegenModeChange: () => void
}) => {
  const { t } = useTranslation()
  const { degenMode } = useSettingsStore()
  const { page, direction, back, next } = useModalPagination()

  const onSelect = () => {
    back()
    onClose()
  }

  return (
    <ModalContents
      disableHeightAnimation
      onClose={onClose}
      onBack={back}
      page={page}
      direction={direction}
      contents={[
        {
          title: t("header.settings.title"),
          headerVariant: "simple",
          noPadding: true,
          content: (
            <HeaderDropdownItems>
              <HeaderDropdownItem
                variant="navigation"
                onClick={next}
                icon={<IconDollar width={22} height={22} />}
                title={t("header.settings.items.displayAsset.title")}
                subtitle={t("header.settings.items.displayAsset.subtitle")}
              />
              <Separator
                color="darkBlue401"
                sx={{ mt: 10, mx: -16, width: "auto" }}
              />
              <HeaderDropdownItem
                variant="toggle"
                icon={<ApeIcon width={22} height={22} />}
                title={t("header.settings.items.degenMode.title")}
                subtitle={t("header.settings.items.degenMode.subtitle")}
                tooltip={t("header.settings.degenMode.description")}
                toggleValue={degenMode}
                onClick={onDegenModeChange}
                css={{ background: "transparent" }}
                sx={{ py: 16 }}
              />
            </HeaderDropdownItems>
          ),
        },
        {
          title: t("header.settings.displayAsset.title"),
          headerVariant: "simple",
          noPadding: true,
          content: <HeaderSettingsDisplayAsset onSelect={onSelect} />,
        },
      ]}
    />
  )
}
