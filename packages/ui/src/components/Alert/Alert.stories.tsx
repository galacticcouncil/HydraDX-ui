import type { Meta, StoryFn } from "@storybook/react-vite"

import { Alert } from "./Alert"

export default {
  component: Alert,
} satisfies Meta<typeof Alert>

export const Info: StoryFn = () => {
  return (
    <Alert variant="info" title="Info" description="This is an info message" />
  )
}

export const Error: StoryFn = () => {
  return (
    <Alert
      variant="error"
      title="Error"
      description="This is an error message"
    />
  )
}

export const Success: StoryFn = () => {
  return (
    <Alert
      variant="success"
      title="Success"
      description="This is a success message"
    />
  )
}

export const Warning: StoryFn = () => {
  return (
    <Alert
      variant="warning"
      title="Warning"
      description="This is a warning message"
    />
  )
}
