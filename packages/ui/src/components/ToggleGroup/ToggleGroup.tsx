import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
} from "react"

import {
  SToggleGroup,
  SToggleGroupIcon,
  SToggleGroupItem,
  ToggleGroupProps,
  ToggleGroupSize,
} from "./ToggleGroup.styled"

const ToggleGroupContext = createContext<ToggleGroupProps>({
  size: "medium",
})

type ToggleGroupCommonProps = ToggleGroupProps & {
  children: React.ReactNode
  disabled?: boolean
}

export type ToggleGroupSingleProps<T extends string> =
  ToggleGroupCommonProps & {
    type: "single"
    value?: T
    defaultValue?: T
    onValueChange?: (value: T) => void
  }

export type ToggleGroupMultipleProps<T> = ToggleGroupCommonProps & {
  type: "multiple"
  value?: T[]
  defaultValue?: T[]
  onValueChange?: (value: T[]) => void
}

export type ToggleGroupRootProps<T extends string> =
  | ToggleGroupSingleProps<T>
  | ToggleGroupMultipleProps<T>

function ToggleGroup<T extends string>({
  size = "medium",
  fullWidth = false,
  children,
  ...props
}: ToggleGroupRootProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const hasMarker = props.type === "single"

  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root || !hasMarker) return

    const active = root.querySelector<HTMLElement>('[data-state="on"]')

    if (!active) {
      // Dropping the live flag freezes geometry while the marker is hidden, so
      // the next selection lands under it rather than sliding across.
      delete root.dataset.markerLive
      root.dataset.marker = "off"
      return
    }

    // offsetLeft/offsetTop are layout-relative and resolve against the root's
    // padding box — the same containing block `left`/`top` use on the pill.
    root.style.setProperty("--marker-left", `${active.offsetLeft}px`)
    root.style.setProperty("--marker-top", `${active.offsetTop}px`)
    root.style.setProperty("--marker-width", `${active.offsetWidth}px`)
    root.style.setProperty("--marker-height", `${active.offsetHeight}px`)
    root.dataset.marker = "on"

    if (!root.dataset.markerLive) {
      requestAnimationFrame(() => {
        if (rootRef.current) rootRef.current.dataset.markerLive = "true"
      })
    }
  }, [hasMarker])

  useLayoutEffect(measure)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !hasMarker) return

    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [measure, hasMarker])

  return (
    <ToggleGroupContext.Provider value={{ size }}>
      <SToggleGroup
        {...props}
        ref={rootRef}
        size={size}
        fullWidth={fullWidth}
        hasMarker={hasMarker}
      >
        {children}
      </SToggleGroup>
    </ToggleGroupContext.Provider>
  )
}

type ToggleGroupItemProps = React.ComponentProps<typeof SToggleGroupItem> & {
  size?: ToggleGroupSize
}

function getMeaningfulChildren(children: React.ReactNode) {
  return Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim() !== "",
  )
}

function ToggleGroupItem({ children, size, ...props }: ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext)
  const meaningfulChildren = getMeaningfulChildren(children)
  const isIconOnly =
    meaningfulChildren.length === 1 && isValidElement(meaningfulChildren[0])

  return (
    <SToggleGroupItem
      $iconOnly={isIconOnly}
      size={size ?? context.size}
      {...props}
    >
      {children}
    </SToggleGroupItem>
  )
}

function ToggleGroupIcon({
  children,
  ...props
}: React.ComponentProps<typeof SToggleGroupIcon>) {
  return <SToggleGroupIcon {...props}>{children}</SToggleGroupIcon>
}

export { ToggleGroup, ToggleGroupIcon, ToggleGroupItem }
