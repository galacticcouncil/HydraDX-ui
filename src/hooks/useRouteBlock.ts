import { useLocation } from "@tanstack/react-location"
import { Transition } from "history"
import { useCallback, useEffect, useRef, useState } from "react"
import { useEvent } from "react-use"

export const useRouteBlock = (when: boolean) => {
  const location = useLocation()

  const hasAccepted = useRef(false)

  const [isBlocking, setIsBlocking] = useState(false)
  const [transition, setTransition] = useState<Transition | null>(null)

  useEffect(() => {
    if (!when) return

    let unblock = location.history.block((transition) => {
      if (transition.action !== "PUSH") return transition.retry()

      setTransition(transition)
      setIsBlocking(true)
      if (hasAccepted.current) {
        unblock()
        transition.retry()
      } else {
        location.current.pathname = window.location.pathname
      }
    })

    return unblock
  }, [location, when])

  const onBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (when) {
        e.preventDefault()
        e.returnValue = ""
      }
    },
    [when],
  )

  useEvent("beforeunload", onBeforeUnload)

  function cancel() {
    hasAccepted.current = false
    setTransition(null)
    setIsBlocking(false)
  }

  function accept() {
    hasAccepted.current = true
    transition?.retry()
    setIsBlocking(false)
  }

  return {
    isBlocking,
    cancel,
    accept,
  }
}
