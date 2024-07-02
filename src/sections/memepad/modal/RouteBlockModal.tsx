import { FC } from "react"
import { Modal } from "components/Modal/Modal"
import { Button } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"

type RouteBlockModalProps = {
  open: boolean
  onAccept: () => void
  onCancel: () => void
}

export const RouteBlockModal: FC<RouteBlockModalProps> = ({
  open,
  onAccept,
  onCancel,
}) => {
  const { t } = useTranslation()

  return (
    <Modal open={open} disableCloseOutside>
      <div
        sx={{
          width: ["100%", "75%"],
          py: [20, 80],
          px: [20, 40],
          mx: "auto",
        }}
      >
        <Text fs={24} tAlign="center" sx={{ mb: 10 }}>
          {t("memepad.modal.routeBlock.title")}
        </Text>
        <Text color="basic400" tAlign="center" sx={{ mb: 30 }}>
          {t("memepad.modal.routeBlock.description")}
        </Text>
        <div sx={{ flex: "row", gap: 20 }}>
          <Button fullWidth onClick={onCancel}>
            {t("back")}
          </Button>
          <Button fullWidth variant="primary" onClick={onAccept}>
            {t("memepad.modal.routeBlock.accept")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
