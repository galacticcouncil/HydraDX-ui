import {
  Root,
  Item,
  ToggleGroupSingleProps,
  ToggleGroupMultipleProps,
} from "@radix-ui/react-toggle-group"
import * as React from "react"
import { SToggleItem, SContainer } from "./ToggleGroup.styled"

export type ItemVariant = "primary" | "secondary" | "tertiary"
export type ItemSize = "extra-small" | "small" | "medium" | "large"

type ContextProps = {
  variant?: ItemVariant
  size?: ItemSize
}

type ToggleGroupRef = React.ElementRef<typeof Root>
type RootProps = ToggleGroupSingleProps | ToggleGroupMultipleProps
type CustomRootProps = ContextProps & {
  deselectable?: boolean
}

type ToggleGroupProps = CustomRootProps & RootProps

const ToggleGroupContext = React.createContext<ContextProps>({
  variant: "primary",
  size: "medium",
})

const ToggleGroup = React.forwardRef<ToggleGroupRef, ToggleGroupProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "medium",
      deselectable = false,
      ...props
    },
    ref,
  ) => {
    const handleValueChange = (value: string | string[]) => {
      if (props.type === "multiple" && Array.isArray(value)) {
        if (!deselectable && value.length === 0) return
        return props.onValueChange?.(value)
      }

      if (props.type === "single" && typeof value === "string") {
        if (!deselectable && value === "") return
        return props.onValueChange?.(value)
      }
    }

    return (
      <Root
        ref={ref}
        className={className}
        asChild
        {...props}
        onValueChange={handleValueChange}
      >
        <SContainer>
          <ToggleGroupContext.Provider value={{ variant, size }}>
            {children}
          </ToggleGroupContext.Provider>
        </SContainer>
      </Root>
    )
  },
)

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof Item>,
  React.ComponentPropsWithoutRef<typeof SToggleItem>
>(({ className, children, variant, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <SToggleItem
      ref={ref}
      variant={context.variant}
      size={context.size}
      className={className}
      {...props}
    >
      {children}
    </SToggleItem>
  )
})

export { ToggleGroup, ToggleGroupItem }
