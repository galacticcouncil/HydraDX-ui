import { Decorator, Meta, StoryObj } from "@storybook/react-vite"

import { AccountAvatar } from "./AccountAvatar"
import { AvatarStyle, useAvatarStyleStore } from "./store"

type Story = StoryObj<typeof AccountAvatar>

// AccountAvatar has no style override prop — the store drives every avatar.
const withAvatarStyle = (avatarStyle: AvatarStyle): Decorator =>
  function AvatarStyleDecorator(Story) {
    if (useAvatarStyleStore.getState().avatarStyle !== avatarStyle) {
      useAvatarStyleStore.setState({ avatarStyle })
    }
    return <Story />
  }

export default {
  component: AccountAvatar,
  decorators: [withAvatarStyle("identican")],
} satisfies Meta<typeof AccountAvatar>

export const Identican: Story = {
  render: (args) => <AccountAvatar {...args} />,
  args: {
    address: "0x19912230039c10861946dF36CDe0eFeF09C3894A",
    size: 100,
  },
}

export const Emoji: Story = {
  ...Identican,
  decorators: [withAvatarStyle("emoji")],
  args: {
    address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    size: 42,
  },
}

export const EmojiDegenGlyph: Story = {
  ...Emoji,
  args: {
    address: "7Hsq5RH9xUtPWFZMGXtoVWNd4CEjpJWsidf7bcGwNwdxp9Ha",
    size: 42,
  },
}

export const EmojiDegenImage: Story = {
  ...Emoji,
  args: {
    address: "7MsLP8yfa4dzCAyBX5jxDk2UR7DEATQYNcfpMxgnRDWx6Xin",
    size: 42,
  },
}

// The ConnectButton size — checks the glyph is still legible when tiny.
export const EmojiSmall: Story = {
  ...Emoji,
  args: {
    address: "7MsLP8yfa4dzCAyBX5jxDk2UR7DEATQYNcfpMxgnRDWx6Xin",
    size: 12,
  },
}
