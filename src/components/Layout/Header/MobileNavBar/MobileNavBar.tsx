import { lazy } from "react"
import { SMobileNavBar } from "./MobileNavBar.styled"

const MobileNavBarContent = lazy(async () => ({
  default: (await import("./MobileNavBarContent")).MobileNavBarContent,
}))

export const MobileNavBar = () => {
  return (
    <SMobileNavBar>
      <MobileNavBarContent />
    </SMobileNavBar>
  )
}
