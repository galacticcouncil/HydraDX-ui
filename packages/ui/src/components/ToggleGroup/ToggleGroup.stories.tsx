import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  BellIcon,
  BookmarkIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  ThumbsUpIcon,
} from "lucide-react"
import { useState } from "react"

import {
  ToggleGroup,
  ToggleGroupIcon,
  ToggleGroupItem,
  ToggleGroupRootProps,
} from "./ToggleGroup"

type Story = StoryObj<typeof ToggleGroup>

export default {
  component: ToggleGroup,
} satisfies Meta<typeof ToggleGroup>
const SingleSelectIconOnlyTemplate = (
  args: Omit<
    ToggleGroupRootProps<string>,
    "type" | "value" | "onValueChange" | "defaultValue"
  >,
) => {
  const [value, setValue] = useState<string>("option1")
  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue} {...args}>
      <ToggleGroupItem value="option1">
        <ToggleGroupIcon>
          <SunIcon />
        </ToggleGroupIcon>
      </ToggleGroupItem>
      <ToggleGroupItem value="option2">
        <ToggleGroupIcon>
          <MoonIcon />
        </ToggleGroupIcon>
      </ToggleGroupItem>
      <ToggleGroupItem value="option3">
        <ToggleGroupIcon>
          <MonitorIcon />
        </ToggleGroupIcon>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const MultipleSelectTemplate = (
  args: Omit<
    ToggleGroupRootProps<string>,
    "type" | "value" | "onValueChange" | "defaultValue"
  >,
) => {
  const [value, setValue] = useState<string[]>(["option1"])
  return (
    <ToggleGroup
      type="multiple"
      value={value}
      onValueChange={setValue}
      {...args}
    >
      <ToggleGroupItem value="option1">
        <ToggleGroupIcon>
          <ThumbsUpIcon />
        </ToggleGroupIcon>
        Like
      </ToggleGroupItem>
      <ToggleGroupItem value="option2">
        <ToggleGroupIcon>
          <BellIcon />
        </ToggleGroupIcon>
        Subscribe
      </ToggleGroupItem>
      <ToggleGroupItem value="option3">
        <ToggleGroupIcon>
          <BookmarkIcon />
        </ToggleGroupIcon>
        Bookmark
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const SingleSelectTemplate = (
  args: Omit<
    ToggleGroupRootProps<string>,
    "type" | "value" | "onValueChange" | "defaultValue"
  >,
) => {
  const [value, setValue] = useState<string>("all")
  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue} {...args}>
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="claimable">Claimable</ToggleGroupItem>
      <ToggleGroupItem value="attention">Needs attention</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Default: Story = {
  render: SingleSelectTemplate,
}

export const Small: Story = {
  render: SingleSelectTemplate,
  args: {
    size: "small",
  },
}

export const Medium: Story = {
  render: SingleSelectTemplate,
  args: {
    size: "medium",
  },
}

export const Large: Story = {
  render: SingleSelectTemplate,
  args: {
    size: "large",
  },
}

export const Multiple: Story = {
  render: MultipleSelectTemplate,
}

export const FullWidth: Story = {
  render: SingleSelectTemplate,
  args: {
    fullWidth: true,
  },
}

export const IconsOnly: Story = {
  render: SingleSelectIconOnlyTemplate,
}

export const SingleDisabled: Story = {
  render: SingleSelectTemplate,
  args: {
    disabled: true,
  },
}

export const MultipleDisabled: Story = {
  render: MultipleSelectTemplate,
  args: {
    disabled: true,
  },
}
