import { METADATA_CDN_URL } from "@galacticcouncil/utils"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search } from "lucide-react"
import React from "react"
import { useState } from "storybook/preview-api"

import { AssetLogo } from "@/components/AssetLogo"
import { Box } from "@/components/Box"
import { Button } from "@/components/Button"
import { Flex } from "@/components/Flex"
import { Input } from "@/components/Input"
import { Text } from "@/components/Text"
import { getToken } from "@/utils"

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerRoot,
} from "./Drawer"

type Story = StoryObj<typeof Drawer>

export default {
  component: Drawer,
} as Meta<typeof Drawer>

const DefaultTemplate = (
  args: React.ComponentPropsWithRef<typeof DrawerRoot>,
) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer {...args} title="Lorem ipsum" open={open} onOpenChange={setOpen}>
        <DrawerBody>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda
          eaque iure nostrum numquam illum aperiam quasi possimus explicabo
          quidem atque ipsa, quam sed corporis ullam blanditiis laboriosam in
          labore. Velit.
        </DrawerBody>
      </Drawer>
    </>
  )
}

const WithHeaderAndFooterTemplate = (
  args: React.ComponentPropsWithRef<typeof DrawerRoot>,
) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer
        {...args}
        open={open}
        onOpenChange={setOpen}
        title="Review Transaction"
        description="Transfer 100 DOT from Hydration to Polkadot"
      >
        <DrawerBody>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit ipsum
          tenetur modi consequatur qui, soluta ratione eveniet cumque aperiam
          porro numquam perspiciatis voluptatum officia, voluptates ducimus
          tempora obcaecati placeat iure?
        </DrawerBody>
        <DrawerFooter justify="space-between">
          <DrawerClose asChild>
            <Button size="large" variant="secondary">
              Cancel
            </Button>
          </DrawerClose>
          <Button size="large" variant="primary">
            Sign transaction
          </Button>
        </DrawerFooter>
      </Drawer>
    </>
  )
}

const WithCustomHeaderTemplate = (
  args: React.ComponentPropsWithRef<typeof DrawerRoot>,
) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer
        {...args}
        open={open}
        title="Lorem ipsum"
        onOpenChange={setOpen}
        customTitle={
          <Box m="var(--modal-content-inset)">
            <Input
              placeholder="Search tokens..."
              variant="embedded"
              customSize="large"
              iconStart={Search}
            />
          </Box>
        }
      >
        <DrawerBody p={0}>
          <Box mx="var(--modal-content-inset)" mt="var(--modal-content-inset)">
            {Array.from({ length: 100 }).map((_, i) => (
              <Flex
                key={i}
                py="base"
                px="var(--modal-content-padding)"
                justify="space-between"
                align="center"
              >
                <Flex align="center" gap="base">
                  <AssetLogo
                    src={`${METADATA_CDN_URL}/v2/polkadot/2034/assets/0/icon.svg`}
                  />
                  <Text fw={600}>HDX</Text>
                </Flex>
                <Text fs="p6" color={getToken("text.medium")}>
                  $1 000
                </Text>
              </Flex>
            ))}
          </Box>
        </DrawerBody>
      </Drawer>
    </>
  )
}

export const Default: Story = {
  render: DefaultTemplate,
}

export const DisabledInteractOutside: Story = {
  render: DefaultTemplate,
  args: {
    disableInteractOutside: true,
  },
}

export const WithHeaderAndFooter: Story = {
  render: WithHeaderAndFooterTemplate,
}

export const WithCustomHeader: Story = {
  render: WithCustomHeaderTemplate,
}
