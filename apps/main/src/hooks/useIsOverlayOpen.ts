import { useEffect, useState } from "react"

/** True when a modal or drawer is open. Ignores Radix popovers (Hints). */
const OVERLAY_SELECTOR = '[role="dialog"][data-state="open"]'
const POPPER_SELECTOR = "[data-radix-popper-content-wrapper]"

const readIsOverlayOpen = (ignoreElement?: Element | null) =>
  Array.from(document.querySelectorAll(OVERLAY_SELECTOR)).some(
    (element) =>
      !element.closest(POPPER_SELECTOR) &&
      (!ignoreElement || !ignoreElement.contains(element)),
  )

export const useIsOverlayOpen = ({
  ignoreRef,
}: {
  ignoreRef?: { readonly current: Element | null }
} = {}): boolean => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const update = () => setIsOpen(readIsOverlayOpen(ignoreRef?.current))

    update()

    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["role", "data-state"],
    })

    return () => observer.disconnect()
  }, [ignoreRef])

  return isOpen
}
