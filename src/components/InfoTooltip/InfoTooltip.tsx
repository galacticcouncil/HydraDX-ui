import * as Tooltip from "@radix-ui/react-tooltip"
import { Text } from "components/Typography/Text/Text"
import { ReactNode, useState } from "react"
import { theme } from "theme"
import { SContent, STrigger } from "./InfoTooltip.styled"

type InfoTooltipProps = {
  text: ReactNode | string
  textOnClick?: ReactNode
  children: ReactNode
  type?: "default" | "black"
  side?: Tooltip.TooltipContentProps["side"]
  asChild?: boolean
}

export function InfoTooltip({
  text,
  textOnClick,
  children,
  type = "default",
  side = "bottom",
  asChild = false,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ReactNode | null>(
    textOnClick != null ? text : null,
  )

  const Trigger = asChild ? Tooltip.Trigger : STrigger

  return (
    <Tooltip.Root
      delayDuration={0}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        // reset state of the content
        textOnClick && !isOpen && setContent(text)
      }}
    >
      <Trigger
        asChild={asChild}
        onClick={(e) => {
          textOnClick && e.preventDefault()
          textOnClick && e.stopPropagation()
          // change the content on the click if the text is provided
          textOnClick && setContent(textOnClick)
          setOpen(true)
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {children}
      </Trigger>
      <Tooltip.Portal>
        <SContent
          type={type}
          side={side}
          align="start"
          sideOffset={3}
          alignOffset={-10}
          collisionPadding={12}
          sx={{ maxWidth: 300 }}
        >
          {typeof text === "string" ? (
            <Text fs={11} fw={500}>
              {textOnClick != null ? content : text}
            </Text>
          ) : (
            text
          )}
          {type === "default" && (
            <Tooltip.Arrow
              css={{
                "& > polygon": { fill: theme.colors.darkBlue400 },
              }}
            />
          )}
        </SContent>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
