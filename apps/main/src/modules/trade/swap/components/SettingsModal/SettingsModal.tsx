import { useMatchRoute } from "@tanstack/react-router"

import { swapTabLink } from "@/config/navigation"
import {
  SwapSettingsModal,
  SwapSettingsSection,
} from "@/modules/trade/swap/components/SettingsModal/SwapSettings/SwapSettingsModal"

type Props = {
  readonly swapSection?: SwapSettingsSection
}

export const SettingsModal = ({ swapSection }: Props) => {
  const matchRoute = useMatchRoute()

  switch (true) {
    case !!matchRoute(swapTabLink("twap")):
      return <SwapSettingsModal section="split" />
    case !!matchRoute(swapTabLink("market")):
      return <SwapSettingsModal section={swapSection} />
    case !!matchRoute(swapTabLink("limit")):
      return <SwapSettingsModal section="none" />
    default:
      throw new Error("Settings are not available for this route.")
  }
}
