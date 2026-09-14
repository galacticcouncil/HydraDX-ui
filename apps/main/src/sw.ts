/**
 * Service worker that deliberately does almost nothing.
 *
 * It exists only so the browser has something to version-diff: when a deploy
 * changes these bytes, the worker installs and `@/utils/appUpdate` shows
 * the "new version available" prompt.
 */

declare global {
  interface Window {
    /**
     * Replaced at build time by `injectManifest` with the build's
     * content-hashed filenames.
     */
    __WB_MANIFEST: ReadonlyArray<{ url: string; revision: string | null }>
    __HYDRATION_BUILD_MANIFEST: Window["__WB_MANIFEST"]
    /** ServiceWorkerGlobalScope lives in lib.webworker, which conflicts with DOM. */
    skipWaiting: () => Promise<void>
  }
}

self.__HYDRATION_BUILD_MANIFEST = self.__WB_MANIFEST

self.addEventListener("install", () => {
  self.skipWaiting()
})

export {}
