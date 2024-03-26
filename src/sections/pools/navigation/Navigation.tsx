import { useLocation } from "@tanstack/react-location"
import AllPools from "assets/icons/AllPools.svg?react"
import IsolatedPools from "assets/icons/IsolatedPools.svg?react"
import OmniStablepools from "assets/icons/Omnipool&Stablepool.svg?react"
import { BackSubHeader } from "components/Layout/Header/BackSubHeader/BackSubHeader"
import {
  SubNavigation,
  SubNavigationTabLink,
} from "components/Layout/SubNavigation/SubNavigation"
import { t } from "i18next"
import { Suspense, lazy } from "react"
import { useTranslation } from "react-i18next"
import { LINKS } from "utils/navigation"

const MyLiquidityTabLink = lazy(async () => ({
  default: (await import("./MyLiquidityTabLink")).MyLiquidityTabLink,
}))

const routeMap = new Map([
  [LINKS.allPools, t("liquidity.navigation.allPools")],
  [LINKS.myLiquidity, t("liquidity.navigation.myLiquidity")],
  [LINKS.omnipool, t("liquidity.navigation.omnipoolAndStablepool")],
  [LINKS.isolated, t("liquidity.navigation.isolated")],
])

export const Navigation = () => {
  const { t } = useTranslation()

  return (
    <SubNavigation>
      <Suspense>
        <MyLiquidityTabLink />
      </Suspense>
      <SubNavigationTabLink
        to={LINKS.allPools}
        label={t("liquidity.navigation.allPools")}
        icon={<AllPools width={16} height={16} />}
      />
      <SubNavigationTabLink
        to={LINKS.omnipool}
        label={t("liquidity.navigation.omnipoolAndStablepool")}
        icon={<OmniStablepools width={18} height={18} />}
      />
      <SubNavigationTabLink
        to={LINKS.isolated}
        label={t("liquidity.navigation.isolated")}
        icon={<IsolatedPools width={15} height={15} />}
      />
    </SubNavigation>
  )
}

export const PoolNavigation = () => {
  const location = useLocation()
  const { pathname } = location.history.location

  return <BackSubHeader label={`Back to ${routeMap.get(pathname)}`} />
}
