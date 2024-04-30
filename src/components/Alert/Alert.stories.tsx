import type { Meta, StoryObj } from "@storybook/react"
import { Alert } from "./Alert"

type Story = StoryObj<typeof Alert>

export default {
  component: Alert,
} as Meta<typeof Alert>

const TEXT = "Your balance is too low. Please charge your account."

export const Info: Story = {
  render: () => <Alert variant="info">{TEXT}</Alert>,
}

export const Warning: Story = {
  render: () => <Alert variant="warning">{TEXT}</Alert>,
}

export const Error: Story = {
  render: () => <Alert variant="error">{TEXT}</Alert>,
}

export const Small: Story = {
  render: () => (
    <Alert variant="info" size="small">
      {TEXT}
    </Alert>
  ),
}

export const Medium: Story = {
  render: () => (
    <Alert variant="info" size="medium">
      {TEXT}
    </Alert>
  ),
}

export const Large: Story = {
  render: () => (
    <Alert variant="info" size="large">
      {TEXT}
    </Alert>
  ),
}
