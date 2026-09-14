import { ButtonIcon, Flex, Icon, Modal } from "@galacticcouncil/ui/components"
import { Link, useSearch } from "@tanstack/react-router"
import { Settings } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { NAVIGATION, SwapTabParam } from "@/config/navigation"
import { SettingsModal } from "@/modules/trade/swap/components/SettingsModal/SettingsModal"
import { TutorialAnchor } from "@/modules/tutorials/TutorialAnchor"
import {
  normalizeSearchForOnChainSwapTab,
  TradeHistorySearchParams,
} from "@/routes/trade/_history/route"
import { useIsIceEnabled } from "@/states/intents"

import { SFormHeader, SHeaderTab } from "./FormHeader.styled"

const swapRouteItems =
  NAVIGATION.find((item) => item.key === "trade")?.children?.find(
    (item) => item.key === "swap",
  )?.children ?? []

const ON_CHAIN_SWAP_TABS = new Set<SwapTabParam>(["limit", "twap"])

const searchForSwapTab = (
  search: TradeHistorySearchParams,
  tab: SwapTabParam | undefined,
) =>
  tab && ON_CHAIN_SWAP_TABS.has(tab)
    ? normalizeSearchForOnChainSwapTab(search)
    : search

export const FormHeader = () => {
  const { t } = useTranslation(["trade", "common"])
  const [openSettings, setOpenSettings] = useState(false)
  const isIceEnabled = useIsIceEnabled()

  const search = useSearch({ from: "/trade/_history/swap" })

  return (
    <SFormHeader justify="space-between" align="center">
      <Flex>
        {swapRouteItems
          .filter((routeItem) => isIceEnabled || routeItem.key !== "swapLimit")
          .map((routeItem) => (
            <SHeaderTab key={routeItem.key} asChild>
              <Link
                to={routeItem.to}
                params={routeItem.params}
                search={searchForSwapTab(
                  search,
                  routeItem.params?.tab as SwapTabParam | undefined,
                )}
                resetScroll={false}
              >
                {t(`common:navigation.${routeItem.key}.title`)}
              </Link>
            </SHeaderTab>
          ))}
      </Flex>

      <TutorialAnchor tutorial="trade-intents" step={0} asChild>
        <ButtonIcon
          onClick={() => setOpenSettings(true)}
          aria-label={t("common:settings")}
          mr="-s"
        >
          <Icon size="m" component={Settings} />
        </ButtonIcon>
      </TutorialAnchor>

      <Modal variant="popup" open={openSettings} onOpenChange={setOpenSettings}>
        <SettingsModal />
      </Modal>
    </SFormHeader>
  )
}
