import IconBonds from "assets/icons/Bonds.svg?react"
import IconDCA from "assets/icons/navigation/IconDCA.svg?react"
import IconOTC from "assets/icons/navigation/IconOTC.svg?react"
import IconSwap from "assets/icons/navigation/IconSwap.svg?react"
import IconYieldDCA from "assets/icons/YieldDcaIcon.svg?react"
import { Icon } from "components/Icon/Icon"
import {
  SubNavigation,
  SubNavigationTabLink,
} from "components/Layout/SubNavigation/SubNavigation"
import { lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { LINKS } from "utils/navigation"

const BondsTabLink = lazy(async () => ({
  default: (await import("./BondsTabLink")).BondsTabLink,
}))

export const Navigation = () => {
  const { t } = useTranslation()
  return (
    <SubNavigation>
      <SubNavigationTabLink
        to={LINKS.swap}
        icon={<IconSwap />}
        label={t("header.trade.swap.title")}
      />
      <SubNavigationTabLink
        to={LINKS.otc}
        icon={<IconOTC />}
        label={t("header.trade.otc.title")}
      />
      <SubNavigationTabLink
        to={LINKS.yieldDca}
        icon={<Icon size={24} icon={<IconYieldDCA />} />}
        label={t("header.trade.yieldDca.title")}
      />
      <SubNavigationTabLink
        to={LINKS.dca}
        icon={<IconDCA />}
        label={t("header.trade.dca.title")}
      />
      <Suspense
        fallback={
          <SubNavigationTabLink
            to={LINKS.bonds}
            icon={<IconBonds />}
            label={t("header.trade.bonds.title")}
          />
        }
      >
        <BondsTabLink />
      </Suspense>
    </SubNavigation>
  )
}
