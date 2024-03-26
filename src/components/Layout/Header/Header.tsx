import HydraLogo from "assets/icons/HydraLogo.svg?react"
import HydraLogoFull from "assets/icons/HydraLogoFull.svg?react"
import { Icon } from "components/Icon/Icon"
import { SHeader } from "components/Layout/Header/Header.styled"
import { useVisibleElements } from "hooks/useVisibleElements"
import { useMedia } from "react-use"
import { theme } from "theme"
import { Link, useSearch } from "@tanstack/react-location"
import { LINKS, resetSearchParams } from "utils/navigation"
import { Suspense, lazy } from "react"

const HeaderBanners = lazy(async () => ({
  default: (await import("components/Layout/Header/banners/HeaderBanners"))
    .HeaderBanners,
}))

const HeaderMenu = lazy(async () => ({
  default: (await import("components/Layout/Header/menu/HeaderMenu"))
    .HeaderMenu,
}))

const HeaderToolbar = lazy(async () => ({
  default: (await import("components/Layout/Header/toolbar/HeaderToolbar"))
    .HeaderToolbar,
}))

export const Header = () => {
  const isMediumMedia = useMedia(theme.viewport.lt.md)

  const search = useSearch()

  const { hiddenElementsKeys, observe } = useVisibleElements()

  return (
    <div css={{ position: "sticky", top: 0, zIndex: 5 }}>
      <Suspense>
        <HeaderBanners />
      </Suspense>
      <SHeader>
        <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
          <div sx={{ flex: "row", align: "center", gap: 40 }}>
            <Link to={LINKS.swap} search={resetSearchParams(search)}>
              <Icon
                sx={{ color: "white" }}
                icon={!isMediumMedia ? <HydraLogoFull /> : <HydraLogo />}
              />
            </Link>
            <Suspense>
              <HeaderMenu ref={observe} />
            </Suspense>
          </div>
          <Suspense>
            <HeaderToolbar menuItems={hiddenElementsKeys} />
          </Suspense>
        </div>
      </SHeader>
    </div>
  )
}
