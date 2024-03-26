import { Icon } from "components/Icon/Icon"
import { useTranslation } from "react-i18next"

import { TabItem } from "utils/navigation"
import { SNavBarItem } from "./MobileNavBar.styled"

export const MobileNavBarItem = ({
  item,
  isActive,
}: {
  item: TabItem
  isActive?: boolean
}) => {
  const { t } = useTranslation()

  return (
    <SNavBarItem active={isActive}>
      <Icon size={20} icon={<item.Icon />} />
      {t(`header.${item.key}`)}
    </SNavBarItem>
  )
}
