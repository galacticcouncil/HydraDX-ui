import {
  SToolbarButton,
  SToolbarIcon,
} from "components/Layout/Header/toolbar/HeaderToolbar.styled"
import { Root } from "@radix-ui/react-dropdown-menu"
import { useSearch } from "@tanstack/react-location"
import { HeaderDropdown } from "components/Layout/Header/HeaderDropdown/HeaderDropdown"
import { HeaderDropdownItem } from "components/Layout/Header/HeaderDropdown/HeaderDropdownItem"
import { HeaderDropdownItems } from "components/Layout/Header/HeaderDropdown/HeaderDropdownItems"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MENU_ITEMS, resetSearchParams } from "utils/navigation"
import { Trigger } from "@radix-ui/react-dropdown-menu"
import MoreTabIcon from "assets/icons/MoreTabIcon.svg?react"

export const MoreMenu = ({ items }: { items?: string[] }) => {
  const [open, setOpen] = useState(false)

  const onClose = () => setOpen(false)

  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Root open={open} onOpenChange={setOpen}>
        <SToolbarButton as={Trigger}>
          <SToolbarIcon as={MoreTabIcon} />
        </SToolbarButton>
        <HeaderDropdown open={open} sx={{ mt: -18, pt: 18 }}>
          <MoreMenuContents items={items} onClose={onClose} />
        </HeaderDropdown>
      </Root>
    </div>
  )
}

export const MoreMenuContents = ({
  onClose,
  items = [],
}: {
  onClose: () => void
  items?: string[]
}) => {
  const { t } = useTranslation()

  const search = useSearch()

  const filteredMenuItems = useMemo(() => {
    if (!items.length) {
      return MENU_ITEMS
    }

    return MENU_ITEMS.filter((item) => items.includes(item.key))
  }, [items])

  return (
    <ModalContents
      disableHeightAnimation
      onClose={onClose}
      contents={[
        {
          title: "",
          headerVariant: "simple",
          noPadding: true,
          content: (
            <HeaderDropdownItems>
              {filteredMenuItems.map((item) => (
                <HeaderDropdownItem
                  variant="navigation"
                  to={item.href}
                  search={resetSearchParams(search)}
                  key={item.key}
                  icon={<item.Icon />}
                  title={t(`header.${item.key}`)}
                />
              ))}
            </HeaderDropdownItems>
          ),
        },
      ]}
    />
  )
}
