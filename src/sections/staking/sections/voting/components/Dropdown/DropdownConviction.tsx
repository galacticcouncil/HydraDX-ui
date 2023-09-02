import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { SContent, Item, STrigger } from "./DropdownConviction.styled"
import { useTranslation } from "react-i18next"
import { Text } from "components/Typography/Text/Text"
import { ReactComponent as ChevronDown } from "assets/icons/ChevronDown.svg"
import { Icon } from "components/Icon/Icon"
import { useState } from "react"
import { theme } from "theme"

const CONVICTIONS = [
  "none",
  "locked1x",
  "locked2x",
  "locked3x",
  "locked4x",
  "locked5x",
  "locked6x",
] as const

export type TConviction = (typeof CONVICTIONS)[number]

export const ConvictionDropdown = ({
  value,
  disabled,
  onChange,
}: {
  value: TConviction
  onChange: (value: TConviction) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu.Root onOpenChange={(open) => setOpen(open)}>
      <STrigger disabled={disabled}>
        <div sx={{ flex: "column", gap: 4 }}>
          <Text fs={10} tTransform="uppercase" color="basic500">
            {t("voting.referenda.conviction.label")}
          </Text>
          <Text fs={13} color="white" sx={{ py: 6 }}>
            {t(`voting.referenda.conviction.${value}`)}
          </Text>
        </div>
        <Icon
          icon={<ChevronDown />}
          sx={{ color: "white" }}
          css={{
            transform: open ? "rotate(180deg)" : undefined,
            transition: `all ${theme.transitions.default}`,
          }}
        />
      </STrigger>
      <DropdownMenu.Portal>
        <SContent
          sideOffset={-2}
          align="start"
          css={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
        >
          {CONVICTIONS.map((i) => (
            <Item key={i} selected={i === value} onClick={() => onChange(i)}>
              {t(`voting.referenda.conviction.${i}`)}
            </Item>
          ))}
        </SContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
