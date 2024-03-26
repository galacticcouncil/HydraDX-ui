import {
  createBrowserHistory,
  ReactLocation,
  Router,
} from "@tanstack/react-location"
import { lazy, Suspense, useEffect } from "react"
import { routes } from "./routes"
import HydraLogoFull from "assets/icons/HydraLogoFull.svg?react"
import { Spinner } from "components/Spinner/Spinner"
import { Page } from "components/Layout/Page/Page"

import "unfonts.css"

const AppProviders = lazy(async () => ({
  default: (await import("components/AppProviders/AppProviders")).AppProviders,
}))

const history = createBrowserHistory()
const location = new ReactLocation({ history })

const HydraSplash = () => {
  return (
    <div
      sx={{
        flex: "column",
        justify: "center",
        align: "center",
      }}
      css={{
        transform: "scale(2)",
        position: "fixed",
        inset: "0",
        height: "100vh",
        width: "100vw",
        zIndex: 1000,
      }}
    >
      <HydraLogoFull />
      <Spinner />
    </div>
  )
}

export const App = () => {
  useEffect(() => {
    const [html] = document.getElementsByTagName("html")
    const [head] = document.getElementsByTagName("head")

    const style = document.createElement("style")
    style.setAttribute("uigc-font-face", "")
    style.setAttribute("uigc-base", "")

    head.appendChild(style)
    html.setAttribute("theme", "hdx")

    return () => {
      html.removeAttribute("theme")
      head.removeChild(style)
    }
  }, [])

  return (
    <Router location={location} routes={routes}>
      <Suspense fallback={<HydraSplash />}>
        <AppProviders>
          <Page />
        </AppProviders>
      </Suspense>
    </Router>
  )
}
