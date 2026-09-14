import { registerSW } from "virtual:pwa-register"
import { create } from "zustand"

/**
 * Browsers only check for a new service worker on navigation, so a long-lived
 * tab has to ask. Refocus covers the backgrounded tab, the interval covers the
 * one left open on a chart for hours.
 */
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

export const useAppUpdateStore = create<{ isAvailable: boolean }>(() => ({
  isAvailable: false,
}))

registerSW({
  // Fires once a newly installed worker takes control of this page, i.e. the
  // tab was open when the deploy landed. A tab that loaded after the deploy
  // never sees this, because it already has the new code.
  onNeedReload: () => useAppUpdateStore.setState({ isAvailable: true }),
  onRegisteredSW: (_url, registration) => {
    if (!registration) return

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update()
    })

    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL)
  },
})
