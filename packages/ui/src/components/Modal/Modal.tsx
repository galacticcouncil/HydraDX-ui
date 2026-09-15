import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { ArrowLeft, X } from "lucide-react"
import { createContext, FC, ReactNode, Ref, useContext, useMemo } from "react"

import { Box, BoxProps } from "@/components/Box"
import { DrawerContent, DrawerHeader, DrawerRoot } from "@/components/Drawer"
import { FlexProps } from "@/components/Flex"
import { Icon } from "@/components/Icon"
import { ScrollArea } from "@/components/ScrollArea"
import { useBreakpoints } from "@/theme"

import { Paper } from "../Paper"
import {
  SModalBody,
  SModalContent,
  SModalContentDivider,
  SModalDescription,
  SModalFooter,
  SModalHeader,
  SModalHeaderButton,
  SModalOverlay,
  SModalPaper,
  SModalTitle,
  SModalTitleContainer,
  SModalTopContent,
  SModalWrapper,
} from "./Modal.styled"

export type ModalVariant = "auto" | "drawer" | "popup"

const ModalContext = createContext<{
  variant: ModalVariant
}>({
  variant: "auto",
})

const ModalRoot = DialogPrimitive.Root

const ModalTrigger = DialogPrimitive.Trigger

const ModalPortal = DialogPrimitive.Portal

const ModalCloseTrigger = DialogPrimitive.Close

type ModalOverlayProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Overlay
> & {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>
}

const ModalOverlay: FC<
  ModalOverlayProps & { animationDurationMs?: number; isBlurred?: boolean }
> = (props) => <SModalOverlay ref={props.ref} {...props} />

type ModalContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Content>>
  topContent?: ReactNode
  animationDurationMs?: number
  contentWidth?: string
}

const ModalContent: FC<ModalContentProps> = ({
  children,
  ref,
  topContent,
  forceMount,
  animationDurationMs,
  ...props
}) => (
  <ModalPortal forceMount={forceMount}>
    <ModalOverlay
      animationDurationMs={animationDurationMs}
      isBlurred={!!topContent}
    />
    <SModalWrapper
      onClick={(e) => e.stopPropagation()}
      animationDurationMs={animationDurationMs}
    >
      <SModalContent ref={ref} {...props} hasTopContent={!!topContent}>
        {topContent && <SModalTopContent>{topContent}</SModalTopContent>}
        <SModalPaper>{children}</SModalPaper>
      </SModalContent>
    </SModalWrapper>
  </ModalPortal>
)

type ModalTitleProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
> & {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Title>>
}

const ModalTitle: FC<ModalTitleProps> = ({ children, ref, ...props }) => (
  <DialogPrimitive.Title ref={ref} asChild {...props}>
    <SModalTitle as="h2">{children}</SModalTitle>
  </DialogPrimitive.Title>
)

type ModalDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
> & {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Description>>
}

const ModalDescription: FC<ModalDescriptionProps> = ({
  children,
  ref,
  ...props
}) => (
  <DialogPrimitive.Description ref={ref} asChild {...props}>
    <SModalDescription>{children}</SModalDescription>
  </DialogPrimitive.Description>
)

type ModalHeaderProps = Omit<FlexProps, "title"> & {
  title: string
  description?: string
  customDescription?: ReactNode
  align?: "default" | "center"
  customHeader?: ReactNode
  customTitle?: ReactNode
  onBack?: () => void
  closable?: boolean
}

type ModalCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>

const ModalClose: FC<ModalCloseProps> = (props) => {
  return (
    <SModalHeaderButton asChild align="right">
      <DialogPrimitive.Close {...props}>
        <Icon component={X} size="l" />
      </DialogPrimitive.Close>
    </SModalHeaderButton>
  )
}

const ModalHeader: FC<ModalHeaderProps> = ({
  title,
  description,
  customDescription,
  align = "default",
  customHeader,
  customTitle,
  onBack,
  closable = true,
  ...props
}: FlexProps & ModalHeaderProps) => {
  const { variant } = useContext(ModalContext)

  if (variant === "drawer") {
    return (
      <DrawerHeader
        title={title}
        description={description}
        customDescription={customDescription}
        customHeader={customHeader}
        customTitle={customTitle}
      />
    )
  }

  return (
    <SModalHeader {...props}>
      <SModalTitleContainer>
        {onBack && (
          <SModalHeaderButton onClick={onBack} align="left">
            <Icon component={ArrowLeft} size="m" />
          </SModalHeaderButton>
        )}

        {customTitle ? (
          <>
            <VisuallyHidden.Root>
              <ModalTitle>{title}</ModalTitle>
            </VisuallyHidden.Root>
            {customTitle}
          </>
        ) : (
          <ModalTitle
            sx={{
              textAlign: align === "center" ? "center" : "left",
              pr: 40,
              pl: align === "default" && !onBack ? 0 : 40,
            }}
          >
            {title}
          </ModalTitle>
        )}

        {closable && <ModalClose />}
      </SModalTitleContainer>

      {customDescription ? (
        <>
          {description && (
            <VisuallyHidden.Root>
              <ModalDescription>{description}</ModalDescription>
            </VisuallyHidden.Root>
          )}
          {customDescription}
        </>
      ) : (
        description && (
          <ModalDescription
            sx={{ textAlign: align === "center" ? "center" : "left" }}
          >
            {description}
          </ModalDescription>
        )
      )}
      {customHeader}
    </SModalHeader>
  )
}

type ModalBodyProps = BoxProps & {
  scrollable?: boolean
  noPadding?: boolean
}

const ModalBody = ({
  scrollable = true,
  children,
  maxHeight,
  ...props
}: ModalBodyProps) => {
  if (scrollable) {
    return (
      <ScrollArea sx={{ flex: 1, height: "auto", minHeight: 0 }}>
        <Box maxHeight={maxHeight ?? "calc(75vh - var(--modal-block-offset))"}>
          <SModalBody {...props}>{children}</SModalBody>
        </Box>
      </ScrollArea>
    )
  }
  return (
    <SModalBody {...props} maxHeight={maxHeight}>
      {children}
    </SModalBody>
  )
}

const ModalFooter = (props: FlexProps) => <SModalFooter {...props} />

export type ModalProps = React.ComponentProps<typeof ModalRoot> & {
  variant?: ModalVariant
  disableInteractOutside?: boolean
  disableAutoFocus?: boolean
  topContent?: ReactNode
  animationDurationMs?: number
  contentWidth?: string
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Content>>
}

const Modal = ({
  children,
  variant = "auto",
  disableInteractOutside = false,
  disableAutoFocus = false,
  topContent,
  animationDurationMs,
  contentWidth,
  ref,
  ...props
}: ModalProps) => {
  const { gte } = useBreakpoints()

  const isDrawer = variant === "auto" ? !gte("md") : variant === "drawer"
  const context = useMemo(() => ({ variant }), [variant])

  if (isDrawer) {
    return (
      <ModalContext.Provider value={context}>
        <DrawerRoot {...props}>
          <DrawerContent
            onInteractOutside={
              disableInteractOutside ? (e) => e.preventDefault() : undefined
            }
            ref={ref}
          >
            {children}
          </DrawerContent>
        </DrawerRoot>
      </ModalContext.Provider>
    )
  }

  return (
    <ModalContext.Provider value={context}>
      <ModalRoot {...props}>
        <ModalContent
          animationDurationMs={animationDurationMs}
          onClick={(e) => e.stopPropagation()}
          topContent={topContent}
          onInteractOutside={
            disableInteractOutside ? (e) => e.preventDefault() : undefined
          }
          onOpenAutoFocus={
            disableAutoFocus ? (e) => e.preventDefault() : undefined
          }
          contentWidth={contentWidth}
          ref={ref}
        >
          {children}
        </ModalContent>
      </ModalRoot>
    </ModalContext.Provider>
  )
}

const ModalContainer = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ModalRoot> & {
  className?: string
}) => (
  <ModalRoot {...props} modal={false}>
    <SModalContent sx={{ position: "unset" }} className={className}>
      <Paper>{children}</Paper>
    </SModalContent>
  </ModalRoot>
)

const ModalContentDivider = SModalContentDivider

export {
  Modal,
  ModalBody,
  ModalClose,
  ModalCloseTrigger,
  ModalContainer,
  ModalContent,
  ModalContentDivider,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
}
