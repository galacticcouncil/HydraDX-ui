import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useRouteBlock } from "hooks/useRouteBlock"
import { useTranslation } from "react-i18next"
import { useMemepadFormContext } from "sections/memepad/form/MemepadFormContext"

export const RouteBlockModal = () => {
  const { t } = useTranslation()

  const { isDirty, isFinalized } = useMemepadFormContext()

  const { isBlocking, accept, cancel } = useRouteBlock(isDirty && !isFinalized)

  return (
    <Modal open={isBlocking} disableCloseOutside>
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
          <Button fullWidth onClick={cancel}>
            {t("back")}
          </Button>
          <Button fullWidth variant="primary" onClick={accept}>
            {t("memepad.modal.routeBlock.accept")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
