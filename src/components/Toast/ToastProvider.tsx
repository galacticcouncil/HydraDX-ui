import { FC, PropsWithChildren, useEffect, useRef, useState } from "react"
import { ToastViewport } from "components/Toast/ToastViewport"
import { Provider } from "@radix-ui/react-toast"
import { useToast } from "state/toasts"
import { Toast } from "components/Toast/Toast"
import { AnimatePresence } from "framer-motion"

import { ToastSidebar } from "./sidebar/ToastSidebar"

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => {
  const { toasts, hide, sidebar, setSidebar } = useToast()

  const activeToasts = toasts.filter((i) => !i.hidden)
  const toast = activeToasts[0]

  const [toastSeenInGroupCount, setToastSeenInGroupCount] = useState(0)

  const currId = toast?.id ?? null
  const lastToastId = useRef<string | null>(currId)
  const lastToastUpdate = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    // ignore quick toast change, user probably hasn't read it within 50ms
    if (Math.abs(now - lastToastUpdate.current) > 50) {
      const prevId = lastToastId.current
      if (prevId !== currId) {
        // if previous toast is null = new session, reset to 0
        // otherwise new toast is in the same "session"
        setToastSeenInGroupCount(prevId == null ? 0 : (counter) => counter + 1)
      }
      lastToastId.current = currId
    }

    lastToastUpdate.current = now
  }, [currId])

  return (
    <>
      <Provider duration={0}>
        <ToastViewport />
        <AnimatePresence>
          {!sidebar && toast && (
            <Toast
              index={1 + toastSeenInGroupCount}
              link={toast.link}
              count={activeToasts.length + toastSeenInGroupCount}
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              actions={toast.actions}
              onClick={() => setSidebar(true)}
              onClose={() => hide(toast.id)}
              persist={toast.persist}
              dateCreated={new Date(toast.dateCreated)}
            />
          )}
        </AnimatePresence>
      </Provider>
      {children}
    </>
  )
}
