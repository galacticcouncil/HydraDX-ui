import { Button } from "./Button"
import type { Meta } from "@storybook/react"

export default {
  component: Button,
} as Meta<typeof Button>

export const Primary = () => (
  <>
    <Button variant="primary">Button</Button>
  </>
)
export const PrimarySmall = () => (
  <Button variant="primary" size="small">
    Button
  </Button>
)
export const PrimaryDisabled = () => (
  <>
    <Button variant="primary" disabled>
      Button
    </Button>
  </>
)
export const Secondary = () => <Button>Button</Button>

export const MutedSecondary = () => (
  <Button variant="mutedSecondary">Button</Button>
)
export const Error = () => <Button variant="error">Button</Button>
export const MutedError = () => <Button variant="mutedError">Button</Button>
export const Warning = () => <Button variant="warning">Button</Button>
export const Outline = () => <Button variant="outline">Button</Button>
export const Transparent = () => <Button variant="transparent">Button</Button>
export const Blue = () => <Button variant="blue">Button</Button>
export const Green = () => <Button variant="green">Button</Button>
export const Loading = () => <Button isLoading>Button</Button>
export const Gradient = () => <Button variant="gradient">Button</Button>
export const TabLink = () => (
  <Button
    variant="outline"
    sx={{
      p: "12px 34px",
    }}
  >
    Assets
  </Button>
)
export const TabLinkActive = () => (
  <Button
    variant="outline"
    active={true}
    sx={{
      p: "12px 34px",
    }}
  >
    Assets
  </Button>
)
