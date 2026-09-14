import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Button } from "@/components"

import { Hint } from "./Hint"

type Story = StoryObj<typeof Hint>

const SHORT = "new: enable or disable intents here"

const LONG =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, so this copy wraps at the content width."

export default {
  component: Hint,
  args: {
    open: true,
    title: "Intents",
    description: SHORT,
    actionLabel: "Got it",
    side: "bottom",
    align: "center",
    asChild: true,
    onAdvance: () => {},
    onDismiss: () => {},
  },
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
    actionLabel: { control: "text" },
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    step: { control: "number" },
    stepCount: { control: "number" },
    badge: { control: "text" },
    badgeVariant: {
      control: "select",
      options: ["primary", "tertiary"],
    },
  },
} satisfies Meta<typeof Hint>

const Template = (args: React.ComponentPropsWithoutRef<typeof Hint>) => (
  <div style={{ display: "grid", placeItems: "center", padding: "8rem" }}>
    <Hint {...args}>
      <Button variant="secondary">Anchor</Button>
    </Hint>
  </div>
)

export const Default: Story = {
  render: (args) => <Template {...args} />,
}

export const Top: Story = {
  render: (args) => <Template {...args} side="top" />,
}

export const Right: Story = {
  render: (args) => <Template {...args} side="right" />,
}

export const Bottom: Story = {
  render: (args) => <Template {...args} side="bottom" />,
}

export const Left: Story = {
  render: (args) => <Template {...args} side="left" />,
}

export const ShortCopy: Story = {
  render: (args) => <Template {...args} description={SHORT} />,
}

export const LongCopy: Story = {
  render: (args) => <Template {...args} description={LONG} />,
}

export const SingleStep: Story = {
  render: (args) => <Template {...args} />,
}

export const MultiStep: Story = {
  args: {
    step: 1,
    stepCount: 6,
    actionLabel: "Next",
  },
  render: (args) => <Template {...args} />,
}

export const LastStep: Story = {
  args: {
    step: 5,
    stepCount: 6,
    actionLabel: "Finish",
  },
  render: (args) => <Template {...args} />,
}

export const MultiStepWithoutTitle: Story = {
  args: {
    title: undefined,
    step: 1,
    stepCount: 6,
    actionLabel: "Next",
  },
  render: (args) => <Template {...args} />,
}

export const SingleStepWithoutTitle: Story = {
  args: {
    title: undefined,
  },
  render: (args) => <Template {...args} />,
}

export const WithBadge: Story = {
  args: {
    badge: "BETA",
  },
  render: (args) => <Template {...args} />,
}

export const BadgeWithoutTitle: Story = {
  args: {
    title: undefined,
    badge: "BETA",
  },
  render: (args) => <Template {...args} />,
}
