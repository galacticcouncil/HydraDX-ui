import "@galacticcouncil/ui/fonts.css"
import "@/utils/appUpdate"

import { ThemeProvider } from "@galacticcouncil/ui/theme"
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { I18nextProvider } from "react-i18next"
import { Toaster } from "sonner"

import { setupPortfolioPersistence } from "@/api/portfolio"
import { DataProviderResolver } from "@/components/DataProviderSelect/DataProviderResolver"
import { Page404 } from "@/components/Page404"
import { RouteError } from "@/components/RouteError"
import i18n from "@/i18n"
import { useRemoveInitialLoader } from "@/modules/layout/hooks/useRemoveInitialLoader"
import { TutorialProvider } from "@/modules/tutorials/TutorialProvider"
import { applyResetTutorialsParam } from "@/modules/tutorials/utils/resetTutorials"

import { routeTree } from "./routeTree.gen"

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error("[RQ]", error, query)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, query) => {
      console.error("[RQ]", error, query)
    },
  }),
})

setupPortfolioPersistence(queryClient)

applyResetTutorialsParam()

export interface RouterContext {
  queryClient: QueryClient
  i18n: typeof i18n
}

const routerContext: RouterContext = {
  queryClient,
  i18n,
}

const router = createRouter({
  routeTree,
  context: routerContext,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 0,
  defaultNotFoundComponent: Page404,
  defaultErrorComponent: RouteError,
  scrollRestoration: true,
  scrollRestorationBehavior: "smooth",
})

console.log("new build 11")

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export const App = () => {
  useRemoveInitialLoader()

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <DataProviderResolver>
          <ThemeProvider>
            <TooltipProvider>
              <TutorialProvider>
                <RouterProvider router={router} />
              </TutorialProvider>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </DataProviderResolver>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

/**
 * Vite Preload Error Handling
 * @see https://vitejs.dev/guide/build#load-error-handling
 */
window.addEventListener("vite:preloadError", () => {
  window.location.reload()
})
