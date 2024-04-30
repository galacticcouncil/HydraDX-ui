import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

import { ReactNode } from "react"
import { STrigger, SContent, SItem } from "./Dropdown.styled"

export type TDropdownItem = {
  key: string
  icon?: ReactNode
  label: ReactNode
  onSelect?: () => void
  disabled?: boolean
}

export function Dropdown(props: {
  items: Array<TDropdownItem>
  children: ReactNode
  onSelect: (key: TDropdownItem) => void
  asChild?: boolean
  header?: ReactNode
  footer?: ReactNode
}) {
  const Trigger = props.asChild ? DropdownMenu.Trigger : STrigger
  return (
    <DropdownMenu.Root>
      <Trigger asChild={props.asChild} disabled={!props.items.length}>
        {props.children}
      </Trigger>
      <DropdownMenu.Portal>
        <SContent sideOffset={8}>
          {props.header}
          {props.items.map((i) => (
            <SItem key={i.key} onClick={() => props.onSelect(i)}>
              {i.icon}
              {i.label}
            </SItem>
          ))}
          {props.footer}
        </SContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
