import { Portal, Root, Trigger } from "@radix-ui/react-tooltip"
import {
  Link,
  useMatchRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-location"
import IconChevron from "assets/icons/ChevronDown.svg?react"
import IconArrow from "assets/icons/IconArrow.svg?react"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { theme } from "theme"
import { TabItemWithSubItems, resetSearchParams } from "utils/navigation"
import {
  SArrow,
  SItem,
  SSubMenu,
  SSubMenuContainer,
  SSubMenuItem,
} from "./HeaderMenu.styled"
import { MobileNavBarItem } from "components/Layout/Header/MobileNavBar/MobileNavBarItem"

type Props = { item: TabItemWithSubItems }

export const HeaderSubMenu = ({ item }: Props) => {
  const { t } = useTranslation()
  const search = useSearch()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const isTablet = useMedia(theme.viewport.gte.sm)

  const match = useMatchRoute()

  const { key, subItems } = item
  const isActive = subItems.some(({ href }) => match({ to: href }))
  const filteredItems = subItems.filter((subItem) => subItem.enabled)

  return (
    <Root delayDuration={0} open={open} onOpenChange={setOpen}>
      <Trigger
        css={{ all: "unset", height: "100%", cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((prev) => !prev)

          const firstLink = filteredItems?.[0]
          isTablet && firstLink && navigate({ to: firstLink.href })
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {isTablet ? (
          <SItem isActive={isActive}>
            {t(`header.${key}`)}
            <IconChevron />
          </SItem>
        ) : (
          <MobileNavBarItem item={item} isActive={open || isActive} />
        )}
      </Trigger>
      <Portal>
        <SSubMenuContainer
          side="bottom"
          align="start"
          sideOffset={isTablet ? 4 : 16}
          alignOffset={-40}
          collisionPadding={16}
        >
          <SSubMenu>
            {filteredItems.map((subItem) => (
              <Link
                key={subItem.key}
                to={subItem.href}
                search={resetSearchParams(search)}
                onClick={() => setOpen(false)}
              >
                <SSubMenuItem>
                  <subItem.Icon
                    sx={{ color: "brightBlue300", width: 24, height: 24 }}
                  />
                  <div>
                    <Text fs={15} lh={15}>
                      {t(`header.${key}.${subItem.key}.title`)}
                    </Text>
                    <Text fs={12} lh={16} color="basic500">
                      {t(`header.${key}.${subItem.key}.subtitle`)}
                    </Text>
                  </div>
                  <SArrow>
                    <IconArrow />
                  </SArrow>
                </SSubMenuItem>
              </Link>
            ))}
          </SSubMenu>
        </SSubMenuContainer>
      </Portal>
    </Root>
  )
}
