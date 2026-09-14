import { METADATA_CDN_URL } from "@galacticcouncil/utils"
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Stack } from "@/components/Stack"

import { AssetLogo, MultipleAssetLogoWrapper } from "./AssetLogo"

type Story = StoryObj<typeof AssetLogo>

export default {
  component: AssetLogo,
} satisfies Meta<typeof AssetLogo>

const ETH_SRC = `${METADATA_CDN_URL}/v2/ethereum/1/icon.svg`
const AAVE_SRC = `${METADATA_CDN_URL}/v2/ethereum/1/assets/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9/icon.svg`
const HDX_SRC = `${METADATA_CDN_URL}/v2/polkadot/2034/assets/0/icon.svg`
const USDT_SRC = `${METADATA_CDN_URL}/v2/polkadot/2034/assets/10/icon.svg`

const Template = (args: React.ComponentPropsWithoutRef<typeof AssetLogo>) => (
  <TooltipProvider>
    <Stack gap="xl">
      <AssetLogo {...args} size="extra-small" />
      <AssetLogo {...args} size="small" />
      <AssetLogo {...args} size="medium" />
      <AssetLogo {...args} size="large" />
    </Stack>
  </TooltipProvider>
)

const MultipleAssetsTemplate = (
  args: Omit<
    React.ComponentPropsWithoutRef<typeof MultipleAssetLogoWrapper>,
    "children"
  >,
) => (
  <MultipleAssetLogoWrapper {...args}>
    <AssetLogo src={HDX_SRC} />
    <AssetLogo src={AAVE_SRC} />
    <AssetLogo src={ETH_SRC} />
    <AssetLogo src={USDT_SRC} />
  </MultipleAssetLogoWrapper>
)

export const Default: Story = {
  render: Template,
  args: {
    src: HDX_SRC,
  },
}

export const WithChain: Story = {
  render: Template,
  args: {
    src: AAVE_SRC,
    chainSrc: ETH_SRC,
  },
}

export const WithMultipleAssets: Story = {
  render: () => (
    <Stack gap="xl">
      <MultipleAssetsTemplate size="extra-small" />
      <MultipleAssetsTemplate size="small" />
      <MultipleAssetsTemplate size="medium" />
      <MultipleAssetsTemplate size="large" />
    </Stack>
  ),
}

export const WithAtokenDecoration: Story = {
  render: (args) => (
    <Stack gap="xl">
      <Template {...args} />
      <MultipleAssetsTemplate decoration={args.decoration} size="extra-small" />
      <MultipleAssetsTemplate decoration={args.decoration} size="small" />
      <MultipleAssetsTemplate decoration={args.decoration} size="medium" />
      <MultipleAssetsTemplate decoration={args.decoration} size="large" />
    </Stack>
  ),
  args: {
    decoration: "atoken",
    src: AAVE_SRC,
  },
}

export const WithYellowBadge: Story = {
  render: Template,
  args: {
    badge: "yellow",
    badgeTooltip: "Warning",
    src: HDX_SRC,
  },
}

export const WithRedBadge: Story = {
  render: Template,
  args: {
    badge: "red",
    badgeTooltip: "Danger",
    src: HDX_SRC,
  },
}

export const Placeholder: Story = {
  render: Template,
}
