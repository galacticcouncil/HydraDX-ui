import { FC } from "react"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import {
  MIGRATION_QUERY_PARAM,
  MIGRATION_TARGET_DOMAIN,
} from "sections/migration/MigrationProvider.utils"
import MigrationLogo from "assets/icons/migration/MigrationLogo.svg?react"
import { useTranslation } from "react-i18next"
import { Separator } from "components/Separator/Separator"

export const MigrationExportModal: FC<{
  data: string
  onCancel: () => void
}> = ({ data, onCancel }) => {
  const { t } = useTranslation()

  return (
    <Modal open headerVariant="GeistMono">
      <MigrationLogo sx={{ mx: "auto" }} />
      <Text tAlign="center" font="GeistMono" fs={19} sx={{ mt: 12 }}>
        {t("migration.export.title")}
      </Text>
      <Text
        tAlign="center"
        sx={{ mt: 12, maxWidth: 500, mx: "auto" }}
        color="basic400"
      >
        {t("migration.export.description")}
      </Text>
      <Text
        tAlign="center"
        sx={{ mt: 12, maxWidth: 500, mx: "auto" }}
        color="basic400"
      >
        {t("migration.export.question")}
      </Text>
      <Separator
        sx={{ mx: [-20, -32], mt: ["auto", 50], mb: [12, 30], width: "auto" }}
        color="darkBlue401"
      />
      <div sx={{ flex: "row", justify: "space-between" }}>
        <Button onClick={onCancel}>{t("close")}</Button>

        <Button
          variant="primary"
          onClick={() => {
            const targetUrl = `https://${MIGRATION_TARGET_DOMAIN}?${MIGRATION_QUERY_PARAM}=${data}`
            window.location.href = targetUrl
          }}
        >
          {t("migration.export.button")}
        </Button>
      </div>
    </Modal>
  )
}
