import { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { getToken } from "@/utils"

import { Box } from "../Box"
import { Logo } from "../Logo"
import { Stack } from "../Stack"
import { AssetInput, AssetInputProps } from "./AssetInput"

type Story = StoryObj<typeof AssetInput>

export default {
  component: AssetInput,
} satisfies Meta<typeof AssetInput>

const SPOT_PRICE = 0.1234
const MAX_BALANCE = "12345"

const HDX = {
  symbol: "HDX",
  icon: (
    <Logo src="https://cdn.jsdelivr.net/gh/galacticcouncil/intergalactic-asset-metadata@master/v2/polkadot/2034/assets/0/icon.svg" />
  ),
}

const Field = (args: AssetInputProps) => {
  const [value, setValue] = useState("")

  return (
    <AssetInput
      label="Sell"
      asset={HDX}
      onAssetClick={() => {}}
      value={value}
      onChange={setValue}
      displayValue={value ? `$${(Number(value) * SPOT_PRICE).toFixed(2)}` : ""}
      balance={{
        label: "Balance",
        value: MAX_BALANCE,
        onMax: () => setValue(MAX_BALANCE),
      }}
      {...args}
    />
  )
}

const Frame = ({ children }: { children: React.ReactNode }) => (
  <Box
    width={500}
    bg={getToken("surfaces.themeBasePalette.surfaceHigh")}
    p="xxl"
  >
    {children}
  </Box>
)

const render = (args: AssetInputProps) => (
  <Frame>
    <Field {...args} />
  </Frame>
)

export const Default: Story = { render }

export const Empty: Story = { render, args: { asset: null } }

export const AmountError: Story = {
  render,
  args: { value: "1234", amountError: "Not enough balance" },
}

export const AssetError: Story = {
  render,
  args: { asset: null, assetError: "Select an asset" },
}

export const Loading: Story = { render, args: { isLoading: true } }

export const ValueLoading: Story = {
  render,
  args: { value: "12", isValueLoading: true, isDisplayValueLoading: true },
}

export const BalanceLoading: Story = {
  render,
  args: { balance: { label: "Balance", value: "", isLoading: true } },
}

export const ReadOnly: Story = {
  render,
  args: { value: "42", isReadOnly: true },
}

export const Disabled: Story = { render, args: { isDisabled: true } }

export const AmountHidden: Story = {
  render,
  args: { label: "Buy", balance: undefined, isAmountHidden: true },
}

export const AllStates: Story = {
  render: () => (
    <Frame>
      <Stack gap="xl">
        <Field />
        <Field isLoading />
        <Field asset={null} />
        <Field value="1234" amountError="Not enough balance" />
        <Field asset={null} assetError="Select an asset" />
        <Field value="12" isValueLoading isDisplayValueLoading />
        <Field isDisabled />
      </Stack>
    </Frame>
  ),
}
