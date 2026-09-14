import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { math } from "@galacticcouncil/sdk-next"
import { Trade, TradeOrder } from "@galacticcouncil/sdk-next/sor"
import {
  Box,
  CollapsibleContent,
  CollapsibleRoot,
  Flex,
  Summary,
  SummaryRowDisplayValue,
  SummaryRowValue,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import Big from "big.js"
import { produce } from "immer"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { calculateSlippage } from "@/api/utils/slippage"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { DynamicFee } from "@/components/DynamicFee"
import { SwapSummaryRow } from "@/modules/trade/swap/components/SwapSummaryRow"
import { TradeRoutes } from "@/modules/trade/swap/components/TradeRoutes/TradeRoutes"
import { CalculatedAmountSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/CalculatedAmountSummaryRow"
import { PriceImpactSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/PriceImpactSummaryRow"
import { TradeLimitSummaryRow } from "@/modules/trade/swap/sections/XcSwap/components/Summary/TradeLimitSummaryRow"
import { useTwapFee } from "@/modules/trade/swap/sections/XcSwap/hooks/useTwapFee"
import { SwapSectionSeparator } from "@/modules/trade/swap/SwapPage.styled"
import { useAssets } from "@/providers/assetsProvider"
import { useIsIceEnabled } from "@/states/intents"
import { useTradeSettings } from "@/states/tradeSettings"
import { scaleHuman } from "@/utils/formatting"
import { getTradeFeeIntervals } from "@/utils/trade"

type Props = {
  readonly swap: Trade
  readonly twap: TradeOrder
  readonly healthFactor: HealthFactorResult | undefined
  readonly sellAsset: TAssetData | null
  readonly buyAsset: TAssetData | null
}

export const TwapSummary: FC<Props> = ({
  swap,
  twap,
  healthFactor,
  sellAsset,
  buyAsset,
}) => {
  const { t } = useTranslation(["common", "trade"])
  const { getAssetWithFallback } = useAssets()

  const isIce = useIsIceEnabled()

  const { update: updateTradeSettings, ...tradeSettings } = useTradeSettings()

  const {
    general: { isSummaryExpanded },
    swap: {
      single: { swapSlippage },
      split: { twapSlippage },
    },
  } = tradeSettings

  const changeSummaryExpanded = (isSummaryExpanded: boolean) =>
    updateTradeSettings(
      produce(tradeSettings, (draft) => {
        draft.general.isSummaryExpanded = isSummaryExpanded
      }),
    )

  const { data: transactionFee, isLoading: isTransactionFeeLoading } =
    useTwapFee(twap)
  const transactionCosts = transactionFee?.feeEstimate || "0"

  const tradeFeeAsset = buyAsset
  const tradeFee = tradeFeeAsset
    ? scaleHuman(twap.tradeFee, tradeFeeAsset.decimals)
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

  const [twapPrice, swapPrice, twapPriceHuman, twapPriceAsset] = (() => {
    if (!sellAsset || !buyAsset) {
      return [0n, 0n, "0", null]
    }

    if (isIce) {
      const twapPrice = twap.amountOut
      return [twapPrice, 0n, scaleHuman(twapPrice, buyAsset.decimals), buyAsset]
    }

    const twapPrice =
      twap.amountOut - calculateSlippage(twap.amountOut, twapSlippage)
    const twapPriceHuman = scaleHuman(twapPrice, buyAsset.decimals)

    const swapPrice =
      swap.amountOut - calculateSlippage(swap.amountOut, swapSlippage)

    return [twapPrice, swapPrice, twapPriceHuman, buyAsset]
  })()

  const [twapPriceDisplay, { isLoading: twapPriceDisplayLoading }] =
    useDisplayAssetPrice(twapPriceAsset?.id ?? "", twapPriceHuman)

  if (!sellAsset || !buyAsset || !tradeFeeAsset || !twapPriceAsset) {
    return null
  }

  const tradeAmount = twap.amountOut

  const tradeFeePct = Big(twap.tradeFee.toString())
    .div(tradeAmount.toString())
    .mul(100)
    .toNumber()

  const [
    ,
    mediumLow = Number.MAX_SAFE_INTEGER,
    mediumHigh = Number.MAX_SAFE_INTEGER,
  ] = getTradeFeeIntervals(0, 0)

  const twapDiff = isIce
    ? 0
    : math.calculateDiffToRef(BigInt(twapPrice), BigInt(swapPrice))
  const twapDiffAbs = Math.abs(twapDiff)

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
            tradeLimit={twapSlippage}
            priceImpact={swap.priceImpactPct}
            settingsSection="split"
          />
          <CalculatedAmountSummaryRow
            label={
              isIce
                ? t("trade:market.summary.estReceived")
                : t("trade:market.summary.minReceived")
            }
            tooltip={
              isIce
                ? t("trade:market.summary.estReceived.tooltip")
                : t("trade:market.summary.minReceived.tooltip")
            }
            amount={
              isIce ? (
                t("currency", {
                  value: twapPriceHuman,
                  symbol: twapPriceAsset.symbol,
                  prefix: t("approx.short"),
                })
              ) : (
                <SummaryRowValue>
                  {t("currency", {
                    value: twapPriceHuman,
                    symbol: twapPriceAsset.symbol,
                  })}
                  <Text as="span" color={getToken("text.tint.quart")}>
                    {t("trade:market.summary.twapPriceDiff", {
                      value: twapDiffAbs,
                    })}
                  </Text>
                </SummaryRowValue>
              )
            }
            amountDisplay={
              twapPriceDisplay
                ? t("parenthesized", {
                    value: twapPriceDisplay,
                  })
                : undefined
            }
            isLoading={twapPriceDisplayLoading}
            isExpanded={isSummaryExpanded}
            onIsExpandedChange={changeSummaryExpanded}
          />
        </Summary>
        <CollapsibleContent asChild>
          <Summary separator={<SwapSectionSeparator />} withLeadingSeparator>
            <PriceImpactSummaryRow
              label={t("trade:market.summary.priceImpact.single")}
              priceImpact={twap.tradeImpactPct}
            />
            <PriceImpactSummaryRow
              label={t("trade:market.summary.priceImpact.split")}
              priceImpact={swap.priceImpactPct}
            />
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
