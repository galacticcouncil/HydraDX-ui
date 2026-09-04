import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import { FC, Ref } from "react"

import { SHoverCardContent } from "@/components/HoverCard/HoverCard.styled"
import { Paper, PaperProps } from "@/components/Paper"

const HoverCard: React.FC<
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>
> = ({ openDelay = 0, closeDelay = 50, ...props }) => (
  <HoverCardPrimitive.Root
    openDelay={openDelay}
    closeDelay={closeDelay}
    {...props}
  />
)

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent: FC<
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> &
    PaperProps & {
      ref?: Ref<React.ElementRef<typeof HoverCardPrimitive.Content>>
    }
> = ({
  align = "start",
  sideOffset = 4,
  collisionPadding = 4,
  p = "base",
  children,
  ref,
  ...props
}) => (
  <SHoverCardContent
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    collisionPadding={collisionPadding}
    asChild
    {...props}
  >
    <Paper p={p}>{children}</Paper>
  </SHoverCardContent>
)

export { HoverCard, HoverCardContent, HoverCardTrigger }
