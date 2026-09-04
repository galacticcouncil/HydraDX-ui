import { SmileIcon, UserRoundIcon } from "@galacticcouncil/ui/assets/icons"
import {
  AvatarStyle,
  MenuItem,
  MenuItemAction,
  MenuItemDescription,
  MenuItemIcon,
  MenuItemLabel,
  ToggleGroup,
  ToggleGroupItem,
  useAvatarStyleStore,
} from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

const getIconByStyle = (style: AvatarStyle) =>
  style === "emoji" ? SmileIcon : UserRoundIcon

const avatarStyles: AvatarStyle[] = ["identican", "emoji"]

export const AvatarPreference: FC = () => {
  const { t } = useTranslation()
  const { avatarStyle, setAvatarStyle } = useAvatarStyleStore()

  return (
    <MenuItem>
      <MenuItemIcon component={getIconByStyle(avatarStyle)} />
      <MenuItemLabel>{t("avatar.title")}</MenuItemLabel>
      <MenuItemDescription>
        {t("avatar.description", {
          style: t(`avatar.${avatarStyle}`),
        })}
      </MenuItemDescription>
      <MenuItemAction>
        <ToggleGroup
          type="single"
          size="small"
          value={avatarStyle}
          onValueChange={(value) => setAvatarStyle(value as AvatarStyle)}
        >
          {avatarStyles.map((style) => (
            <ToggleGroupItem key={style} value={style} sx={{ px: "m" }}>
              {t(`avatar.${style}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </MenuItemAction>
    </MenuItem>
  )
}
