import type { Meta, StoryObj } from "@storybook/react"
import { Stepper } from "./Stepper"
import { ComponentPropsWithoutRef } from "react"

type Story = StoryObj<typeof Stepper>

export default {
  component: Stepper,
} as Meta<typeof Stepper>

const Template = (props: Partial<ComponentPropsWithoutRef<typeof Stepper>>) => (
  <Stepper
    {...props}
    sx={{ mx: "auto" }}
    steps={[
      {
        label: "Create & Register",
        state: "done",
      },
      {
        label: "Transfer Liquidity",
        state: "active",
      },
      {
        label: "Create Isolated Pool",
        state: "todo",
      },
      {
        label: "Summary",
        state: "todo",
      },
    ]}
  />
)

export const Default: Story = {
  render: Template,
}

export const fullWidth: Story = {
  render: Template,
  args: {
    fullWidth: true,
  },
}
