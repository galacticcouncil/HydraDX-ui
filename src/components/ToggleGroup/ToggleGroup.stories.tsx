import { Meta, StoryObj } from "@storybook/react"
import { ComponentPropsWithoutRef, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup"

type Story = StoryObj<typeof ToggleGroup>

export default {
  component: ToggleGroup,
} as Meta<typeof ToggleGroup>

const Template = ({
  size,
  variant,
  disabled,
  type,
  deselectable,
}: ComponentPropsWithoutRef<typeof ToggleGroup>) => {
  const [value, setValue] = useState(
    type === "multiple" ? ["assets", "farming"] : "assets",
  )
  return (
    <ToggleGroup
      value={value as string}
      type={(type || "single") as "single"}
      onValueChange={setValue}
      size={size}
      variant={variant}
      disabled={disabled}
      deselectable={deselectable}
      sx={{ display: "inline-flex" }}
    >
      <ToggleGroupItem value="assets">Assets</ToggleGroupItem>
      <ToggleGroupItem value="liquidity">Liquidity</ToggleGroupItem>
      <ToggleGroupItem value="farming">Farming</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Default: Story = {
  render: Template,
}

export const Primary: Story = {
  render: Template,
  args: {
    variant: "primary",
  },
}

export const Secondary: Story = {
  render: Template,
  args: {
    variant: "secondary",
  },
}

export const Tertiary: Story = {
  render: Template,
  args: {
    variant: "tertiary",
  },
}

export const Small: Story = {
  render: Template,
  args: {
    size: "small",
  },
}

export const ExtraSmall: Story = {
  render: Template,
  args: {
    size: "extra-small",
  },
}

export const Medium: Story = {
  render: Template,
  args: {
    size: "medium",
  },
}

export const Large: Story = {
  render: Template,
  args: {
    size: "large",
  },
}
export const Disabled: Story = {
  render: Template,
  args: {
    disabled: true,
  },
}

export const Multiple: Story = {
  render: Template,
  args: {
    type: "multiple",
    deselectable: true,
  },
}
