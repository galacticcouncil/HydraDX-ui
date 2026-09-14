import {
  ModalBody,
  ModalContentDivider,
  ModalHeader,
} from "@galacticcouncil/ui/components"
import { preventDefault } from "@galacticcouncil/utils"
import { FC } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { SingleTradeSection } from "@/modules/trade/swap/components/SettingsModal/SwapSettings/SingleTradeSection"
import { TwapSection } from "@/modules/trade/swap/components/SettingsModal/SwapSettings/TwapSection"
import { useSwapSettingsForm } from "@/modules/trade/swap/components/SettingsModal/SwapSettings/useSwapSettingsForm"
import { TradeExecutionSection } from "@/modules/trade/swap/components/SettingsModal/TradeExecutionSection"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"

export type SwapSettingsSection = "single" | "split" | "none"

type Props = {
  readonly section?: SwapSettingsSection
}

export const SwapSettingsModal: FC<Props> = ({ section }) => {
  const { t } = useTranslation(["common", "trade"])
  const { featureFlags } = useRpcProvider()

  const { update, ...tradeSettings } = useTradeSettings()
  const form = useSwapSettingsForm(tradeSettings.swap, (swap) =>
    update({ ...tradeSettings, swap }),
  )

  const showSingle = !section || section === "single"
  const showSplit = !section || section === "split"
  const showTradeSections = showSingle || showSplit

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("trade:swap.settings.modal.title")}
        description={t("trade:swap.settings.modal.description")}
      />
      <ModalBody
        sx={{ minHeight: ["auto", showTradeSections ? 400 : "auto"], pt: 0 }}
      >
        {featureFlags.isIceEnabled && (
          <>
            <TradeExecutionSection />
            {showTradeSections && <ModalContentDivider />}
          </>
        )}
        {showTradeSections && (
          <form onSubmit={preventDefault}>
            {showSingle && <SingleTradeSection />}
            {showSingle && showSplit && <ModalContentDivider />}
            {showSplit && <TwapSection />}
          </form>
        )}
      </ModalBody>
    </FormProvider>
  )
}
