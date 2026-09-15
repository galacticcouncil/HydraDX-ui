import { Chip } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

export const AutoManagedBadge = () => {
  const { t } = useTranslation("liquidity")

  return (
    <Chip variant="blue" size="extra-small" rounded>
      {t("vaults.autoManaged")}
    </Chip>
  )
}
