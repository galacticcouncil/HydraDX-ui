import ApeIcon from "assets/icons/ApeIcon.svg?react"
import IconLink from "assets/icons/LinkIcon.svg?react"
import PixelBg from "assets/icons/PixelBg.svg?react"
import { Button } from "components/Button/Button"
import { CheckBox } from "components/CheckBox/CheckBox"
import { SLearnMoreLink } from "components/Layout/Header/DegenMode/DegenModeModal.styled"

import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"

type DegenModeModalProps = {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export const DegenModeModal: FC<DegenModeModalProps> = ({
  open,
  onClose,
  onAccept,
}) => {
  const { t } = useTranslation()
  const [accepted, setAccepted] = useState(false)
  return (
    <Modal open={open} onClose={onClose}>
      <div sx={{ p: [20, 32] }}>
        <div
          css={{ position: "relative" }}
          sx={{
            flex: "row",
            align: "center",
            justify: "center",
            p: 20,
          }}
        >
          <PixelBg />
          <ApeIcon
            width={42}
            height={42}
            sx={{
              color: "brightBlue300",
              top: "50%",
              left: "50%",
              ml: -21,
              mt: -21,
            }}
            css={{ position: "absolute" }}
          />
        </div>
        <div sx={{ width: ["100%", "75%"], mx: "auto" }}>
          <Text font="GeistMono" tAlign="center" fs={22} sx={{ mt: 20 }}>
            {t("header.settings.degenMode.title")}
          </Text>
          <Text color="basic400" tAlign="center" sx={{ mt: 20 }}>
            {t("header.settings.degenMode.description")}
          </Text>
          <Text tAlign="center" sx={{ mt: 10 }}>
            <SLearnMoreLink>
              {t("stats.tiles.link")}
              <IconLink />
            </SLearnMoreLink>
          </Text>
          <Separator sx={{ mt: 20 }} color="darkBlue401" />
          <CheckBox
            sx={{ mt: 14, mb: 32 }}
            size="small"
            variant="secondary"
            checked={accepted}
            onChange={setAccepted}
            label={
              <Text fs={14} color="brightBlue300">
                {t("header.settings.degenMode.disclaimer")}
              </Text>
            }
          />
        </div>
        <Separator
          sx={{ mt: 20, mx: [-20, -32], width: "auto", my: 20 }}
          color="darkBlue401"
        />
        <div sx={{ flex: "row", justify: "space-between" }}>
          <Button onClick={onClose}>{t("close")}</Button>
          <Button variant="primary" disabled={!accepted} onClick={onAccept}>
            {t("header.settings.degenMode.enable")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
