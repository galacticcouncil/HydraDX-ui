import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { FC, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  importToLocalStorage,
  useMigrationStore,
} from "sections/migration/MigrationProvider.utils"
import MigrationLogo from "assets/icons/migration/MigrationLogo.svg?react"

export const MigrationImportModal: FC<{ data?: string }> = ({ data }) => {
  const { t } = useTranslation()
  const { migrationCompleted, setMigrationCompleted } = useMigrationStore()

  const lastImportDateRef = useRef(
    migrationCompleted && migrationCompleted !== "0"
      ? new Date(migrationCompleted)
      : null,
  )

  const lastImportDate = lastImportDateRef.current

  const reloadAppWithTimestamp = useCallback(
    (date?: string) => {
      setMigrationCompleted(date ?? "0")
      window.location.href = window.location.origin
    },
    [setMigrationCompleted],
  )

  const importAndReload = useCallback(
    (data: string) => {
      try {
        importToLocalStorage(data)
        reloadAppWithTimestamp(new Date().toISOString())
      } catch (err) {
        reloadAppWithTimestamp()
      }
    },
    [reloadAppWithTimestamp],
  )

  return (
    <Modal open headerVariant="GeistMono">
      <MigrationLogo sx={{ mx: "auto" }} />
      <Text tAlign="center" font="GeistMono" fs={19} sx={{ mt: 12 }}>
        {lastImportDate
          ? t("migration.import.overwrite.title")
          : t("migration.import.confirm.title")}
      </Text>
      <Text
        tAlign="center"
        sx={{ mt: 12, maxWidth: 500, mx: "auto" }}
        color="basic400"
      >
        {lastImportDate
          ? t("migration.import.overwrite.description", {
              date: lastImportDate,
            })
          : t("migration.import.confirm.description")}
      </Text>
      <Separator
        sx={{ mx: [-20, -32], mt: ["auto", 50], mb: [12, 30], width: "auto" }}
        color="darkBlue401"
      />
      <div sx={{ flex: "row", justify: "space-between" }}>
        <Button
          onClick={() => {
            reloadAppWithTimestamp()
          }}
        >
          {t("close")}
        </Button>
        {data && (
          <Button
            variant={lastImportDate ? "mutedError" : "primary"}
            onClick={() => {
              importAndReload(data)
            }}
          >
            {lastImportDate
              ? t("migration.import.overwrite.button")
              : t("migration.import.confirm.button")}
          </Button>
        )}
      </div>
    </Modal>
  )
}
