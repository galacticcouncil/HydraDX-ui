import { ComponentPropsWithoutRef, useState } from "react"
import { CheckBox } from "./CheckBox"
import { Text } from "components/Typography/Text/Text"
import { Meta, StoryObj } from "@storybook/react"

export default {
  component: CheckBox,
} as Meta<typeof CheckBox>

type Story = StoryObj<typeof CheckBox>

const Template = (props: ComponentPropsWithoutRef<typeof CheckBox>) => {
  const [checked, setChecked] = useState(false)
  return <CheckBox {...props} checked={checked} onChange={setChecked} />
}

export const Primary: Story = {
  render: Template,
}

export const PrimarySmall: Story = {
  render: Template,
  args: {
    size: "small",
  },
}

export const PrimaryLarge: Story = {
  render: Template,
  args: {
    size: "large",
  },
}
export const Secondary: Story = {
  render: Template,
  args: {
    variant: "secondary",
  },
}

export const Disabled: Story = {
  render: Template,
  args: {
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: Template,
  args: {
    label: (
      <Text fs={14} lh={28}>
        I agree with terms a and conditions.
      </Text>
    ),
  },
}
