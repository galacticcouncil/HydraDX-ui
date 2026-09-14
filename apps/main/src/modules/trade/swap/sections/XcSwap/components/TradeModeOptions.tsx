import { Flex, OptionCard } from "@galacticcouncil/ui/components"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { formatDistanceToNowStrict } from "date-fns"
import { FC } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { doNothing } from "remeda"

import { TAssetData } from "@/api/assets"
import {
  Trade,
  TradeOrder,
  tradeOrderDurationQuery,
  TradeType,
} from "@/api/trade"
import { TradeOption } from "@/modules/trade/swap/components/TradeOption/TradeOption"
import { TradeOptionSkeleton } from "@/modules/trade/swap/components/TradeOption/TradeOptionSkeleton"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { isTwapEnabled } from "@/modules/trade/swap/sections/XcSwap/lib/isTwapEnabled"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"
import { scaleHuman } from "@/utils/formatting"

type Props = {
  readonly sellAsset: TAssetData | null
  readonly buyAsset: TAssetData | null
  readonly swap: Trade | undefined
  readonly twap: TradeOrder | undefined
  readonly isSwapLoading: boolean
  readonly isTwapLoading: boolean
}

export const TradeModeOptions: FC<Props> = ({
  sellAsset,
  buyAsset,
  swap,
  twap,
  isSwapLoading,
  isTwapLoading,
}) => {
  const { t } = useTranslation("trade")
  const rpc = useRpcProvider()
  const isIce = useIsIceEnabled()

  const { control } = useFormContext<XcSwapFormValues>()

  const { data: twapDurationMs = 0 } = useQuery(
    tradeOrderDurationQuery(
      rpc,
      isIce,
      twap?.tradeCount ?? 0,
      twap?.tradePeriod ?? 0,
    ),
  )

  const showFullSkeleton = isSwapLoading || !swap
  const showSplitSkeleton = isTwapLoading || !twap

  if (showFullSkeleton) {
    return (
      <Flex direction="column" gap="base">
        <TradeOptionSkeleton />
        <TradeOptionSkeleton />
      </Flex>
    )
  }

  if (!buyAsset || !sellAsset) {
    return null
  }

  const isBuy = swap.type === TradeType.Buy

  const [asset, amount, twapAmount] = isBuy
    ? [sellAsset, swap.amountIn, twap?.amountIn]
    : [buyAsset, swap.amountOut, twap?.amountOut]

  const price = scaleHuman(amount, asset.decimals)
  const twapPrice = twapAmount ? scaleHuman(twapAmount, asset.decimals) : "0"

  const feeSaving = twap
    ? Math.max(
        0,
        Number(scaleHuman(swap.tradeFee, asset.decimals)) -
          Number(scaleHuman(twap.tradeFee, asset.decimals)),
      ).toString()
    : "0"
  const outputDiff = Big(twapPrice).minus(price).toString()
  const diff = isIce ? feeSaving : outputDiff

  return (
    <Controller
      control={control}
      name="isSingleTrade"
      render={({ field }) => (
        <Flex direction="column" gap="base">
          <TradeOption
            asset={asset}
            value={price}
            active={field.value}
            onClick={(): void => {
              field.onChange(true)
            }}
            label={t("market.form.type.single")}
            time={t("market.form.type.single.instant")}
          />
          {!isTwapEnabled(swap) ? (
            <OptionCard
              label={t("market.form.type.split")}
              description={t("market.form.type.split.unavailable")}
              value=""
              isActive={false}
              onClick={doNothing}
              disabled
            />
          ) : showSplitSkeleton ? (
            <TradeOptionSkeleton />
          ) : (
            <TradeOption
              asset={asset}
              value={twapPrice}
              diff={diff}
              approx={isIce}
              active={!field.value}
              onClick={(): void => {
                field.onChange(false)
              }}
              label={t("market.form.type.split")}
              time={t("market.form.type.split.timeframe", {
                timeframe: formatDistanceToNowStrict(
                  Date.now() + twapDurationMs,
                ),
              })}
              disabled={!!twap.errors.length}
            />
          )}
        </Flex>
      )}
    />
  )
}
