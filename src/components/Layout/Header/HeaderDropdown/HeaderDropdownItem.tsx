import React, { ComponentPropsWithoutRef, ReactNode, useId } from "react"
import { Icon } from "components/Icon/Icon"
import {
  SItemButton,
  SItemLink,
} from "components/Layout/Header/HeaderDropdown/HeaderDropdown.styled"
import { Text } from "components/Typography/Text/Text"
import IconArrow from "assets/icons/IconArrow.svg?react"
import { Switch } from "components/Switch/Switch"
import { undefinedNoop } from "utils/helpers"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"

type ItemHtmlAttributes = ComponentPropsWithoutRef<typeof SItemLink> &
  ComponentPropsWithoutRef<typeof SItemButton>

export type HeaderDropdownItemProps = ItemHtmlAttributes & {
  icon: ReactNode
  onClick?: () => void
  title: string
  subtitle?: string
  tooltip?: string
  variant: "navigation" | "toggle"
  toggleValue?: boolean
}

export const HeaderDropdownItem: React.FC<HeaderDropdownItemProps> = ({
  icon,
  onClick,
  title,
  subtitle,
  tooltip,
  variant,
  toggleValue = false,
  ...props
}) => {
  const id = useId()
  const isButton = !!onClick
  const Item = isButton ? SItemButton : SItemLink
  return (
    <Item onClick={onClick} {...props} as="button">
      {icon && (
        <Icon
          sx={{
            color:
              variant === "toggle" && !toggleValue
                ? "darkBlue300"
                : "brightBlue200",
          }}
          icon={icon}
        />
      )}
      <div sx={{ flex: "column", gap: 3 }}>
        <Text
          fs={14}
          lh={14}
          fw={600}
          color="basic100"
          sx={{ flex: "row", gap: 4, align: "center" }}
        >
          {title}
          {tooltip && (
            <InfoTooltip text={tooltip}>
              <SInfoIcon />
            </InfoTooltip>
          )}
        </Text>
        {subtitle && (
          <Text fs={12} lh={18} fw={400} color="basic500">
            {subtitle}
          </Text>
        )}
      </div>
      {variant === "navigation" && <IconArrow />}
      {variant === "toggle" && (
        <Switch
          name={`${id}-toggle`}
          onCheckedChange={undefinedNoop}
          value={toggleValue}
          size="small"
        />
      )}
    </Item>
  )
}
