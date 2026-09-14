import { Box } from "@galacticcouncil/ui/components"
import { useFormContext } from "react-hook-form"

import { TradeErrors } from "@/modules/trade/swap/sections/XcSwap/components/TradeErrors"
import { TradeModeOptions } from "@/modules/trade/swap/sections/XcSwap/components/TradeModeOptions"
import { TradeWarnings } from "@/modules/trade/swap/sections/XcSwap/components/TradeWarnings"
import { useOnChainTradeAssets } from "@/modules/trade/swap/sections/XcSwap/hooks/useOnChainTradeAssets"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { isXcSwapTradeEnabled } from "@/modules/trade/swap/sections/XcSwap/lib/isXcSwapTradeEnabled"
import { useXcSwap } from "@/modules/trade/swap/sections/XcSwap/XcSwapProvider"

export const XcSwapOptions = () => {
  const { quote, isQuoteLoading, isTwapLoading, isCrossChain } = useXcSwap()
  const form = useFormContext<XcSwapFormValues>()
  const { sellAsset, buyAsset } = useOnChainTradeAssets()

  const isSingleTrade = form.watch("isSingleTrade")
  const onChainQuote = quote?.kind === "oc" ? quote : null
  const isFormValid =
    form.formState.isValid && isXcSwapTradeEnabled(quote, isSingleTrade)
  const isShown = !isCrossChain && (isQuoteLoading || !!onChainQuote)

  if (!isShown) {
    return null
  }

  return (
    <Box py="l">
      <TradeModeOptions
        sellAsset={sellAsset}
        buyAsset={buyAsset}
        swap={onChainQuote?.swap}
        twap={onChainQuote?.twap}
        isSwapLoading={isQuoteLoading}
        isTwapLoading={isTwapLoading}
      />
      {onChainQuote && (
        <TradeWarnings
          isFormValid={isFormValid}
          isSingleTrade={isSingleTrade}
          swap={onChainQuote.swap}
          twap={onChainQuote.twap}
          healthFactor={undefined}
          healthFactorRiskAccepted={false}
          setHealthFactorRiskAccepted={() => {}}
        />
      )}
      {onChainQuote && <TradeErrors swap={onChainQuote.swap} />}
    </Box>
  )
}
