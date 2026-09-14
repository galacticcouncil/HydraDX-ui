import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { Trade } from "@galacticcouncil/sdk-next/sor"
import {
  Box,
  CollapsibleContent,
  CollapsibleRoot,
  Flex,
  Summary,
  SummaryRowDisplayValue,
  SummaryRowValue,
} from "@galacticcouncil/ui/components"
import { produce } from "immer"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { TradeType } from "@/api/trade"
import { calculateSlippage } from "@/api/utils/slippage"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { DynamicFee } from "@/components/DynamicFee"
import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { TradeRoutes } from "@/modules/trade/swap/components/TradeRoutes/TradeRoutes"
import { CalculatedAmountSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/CalculatedAmountSummaryRow"
import { PriceImpactSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/PriceImpactSummaryRow"
import { TradeLimitSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/TradeLimitSummaryRow"
import { useSwapFee } from "@/modules/trade/swap/sections/XcSwap/hooks/useSwapFee"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { useAssets } from "@/providers/assetsProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { scaleHuman } from "@/utils/formatting"
import { getTradeFeeIntervals } from "@/utils/trade"

type Props = {
  readonly swap: Trade
  readonly healthFactor: HealthFactorResult | undefined
  readonly sellAsset: TAssetData | null
  readonly buyAsset: TAssetData | null
}

export const SwapSummary: FC<Props> = ({
  swap,
  healthFactor,
  sellAsset,
  buyAsset,
}) => {
  const { t } = useTranslation(["common", "trade"])
  const { getAssetWithFallback } = useAssets()

  const { update: updateTradeSettings, ...tradeSettings } = useTradeSettings()

  const {
    general: { isSummaryExpanded },
    swap: {
      single: { swapSlippage },
    },
  } = tradeSettings

  const changeSummaryExpanded = (isSummaryExpanded: boolean) =>
    updateTradeSettings(
      produce(tradeSettings, (draft) => {
        draft.general.isSummaryExpanded = isSummaryExpanded
      }),
    )

  const { data: transactionFee, isLoading: isTransactionFeeLoading } =
    useSwapFee(swap)
  const transactionCosts = transactionFee?.feeEstimate || "0"

  const isBuy = swap.type === TradeType.Buy
  const tradeFeeAsset = isBuy ? sellAsset : buyAsset
  const tradeFee = tradeFeeAsset
    ? scaleHuman(swap.tradeFee, tradeFeeAsset.decimals)
    : "0"

  const [tradeFeeDisplay] = useDisplayAssetPrice(
    tradeFeeAsset?.id ?? "",
    tradeFee,
    { maximumFractionDigits: null },
  )

  const transactionFeeAsset = getAssetWithFallback(
    transactionFee?.feeAssetId ?? "",
  )

  const [transactionCostsDisplay] = useDisplayAssetPrice(
    transactionFee?.feeAssetId ?? "",
    transactionCosts,
    { maximumFractionDigits: null },
  )

  const minSummaryAsset = isBuy ? sellAsset : buyAsset
  const minSummaryValue = isBuy
    ? scaleHuman(
        swap.amountIn + calculateSlippage(swap.amountIn, swapSlippage),
        sellAsset?.decimals ?? 0,
      )
    : scaleHuman(
        swap.amountOut - calculateSlippage(swap.amountOut, swapSlippage),
        buyAsset?.decimals ?? 0,
      )

  const [minSummaryValueDisplay, { isLoading: minSummaryValueDisplayLoading }] =
    useDisplayAssetPrice(minSummaryAsset?.id ?? "", minSummaryValue)

  if (!sellAsset || !buyAsset || !tradeFeeAsset || !minSummaryAsset) {
    return null
  }

  const tradeFeePct = swap.tradeFeePct
  const tradeFeeRange = swap.tradeFeeRange ?? [0, 0]

  const [min, max] = tradeFeeRange
  const [
    ,
    mediumLow = Number.MAX_SAFE_INTEGER,
    mediumHigh = Number.MAX_SAFE_INTEGER,
  ] = getTradeFeeIntervals(min, max)

  return (
    <Box>
      {healthFactor?.isSignificantChange && (
        <>
          <SwapSummaryRow
            label={t("healthFactor")}
            content={<HealthFactorChange {...healthFactor} />}
          />
          <SwapSectionSeparator />
        </>
      )}
      <CollapsibleRoot
        open={isSummaryExpanded}
        onOpenChange={changeSummaryExpanded}
      >
        <Summary separator={<SwapSectionSeparator />}>
          <TradeLimitSummaryRow
            tradeLimit={swapSlippage}
            priceImpact={swap.priceImpactPct}
            settingsSection="single"
          />
          <CalculatedAmountSummaryRow
            label={
              isBuy
                ? t("trade:market.summary.maxSent")
                : t("trade:market.summary.minReceived")
            }
            tooltip={
              isBuy
                ? t("trade:market.summary.maxSent.tooltip")
                : t("trade:market.summary.minReceived.tooltip")
            }
            amount={t("currency", {
              value: minSummaryValue,
              symbol: minSummaryAsset.symbol,
            })}
            amountDisplay={t("parenthesized", {
              value: minSummaryValueDisplay,
            })}
            isLoading={minSummaryValueDisplayLoading}
            isExpanded={isSummaryExpanded}
            onIsExpandedChange={changeSummaryExpanded}
          />
        </Summary>
        <CollapsibleContent asChild>
          <Summary separator={<SwapSectionSeparator />} withLeadingSeparator>
            <PriceImpactSummaryRow priceImpact={swap.priceImpactPct} />
            <SwapSummaryRow
              label={t("trade:market.summary.estTradeFees")}
              content={
                <DynamicFee
                  amount={tradeFeeDisplay}
                  value={tradeFeePct}
                  rangeLow={mediumLow}
                  rangeHigh={mediumHigh}
                />
              }
              tooltip={t("trade:market.summary.estTradeFees.tooltip")}
            />
            <SwapSummaryRow
              label={t("trade:market.summary.transactionCosts")}
              loading={isTransactionFeeLoading}
              content={
                <Flex gap="s" align="center" justify="flex-end">
                  <SummaryRowValue>
                    {t("currency", {
                      value: transactionCosts,
                      symbol: transactionFeeAsset.symbol,
                    })}
                  </SummaryRowValue>
                  <SummaryRowDisplayValue>
                    {t("parenthesized", {
                      value: transactionCostsDisplay,
                    })}
                  </SummaryRowDisplayValue>
                </Flex>
              }
              tooltip={t("trade:market.summary.transactionCosts.tooltip")}
            />
            <SwapSummaryRow
              label={t("trade:market.summary.routes.label")}
              content={
                <TradeRoutes
                  swapType={swap.type}
                  totalFeesDisplay={tradeFeeDisplay}
                  routes={swap.swaps}
                />
              }
            />
          </Summary>
        </CollapsibleContent>
      </CollapsibleRoot>
    </Box>
  )
}
