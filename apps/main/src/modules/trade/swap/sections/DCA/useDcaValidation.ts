import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import { TradeDcaOrder } from "@galacticcouncil/sdk-next/sor"
import { getAssetIdFromAddress } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"

import { aaveSummaryQuery } from "@/api/aave"
import { TimeFrame } from "@/components/TimeFrame/TimeFrame.utils"
import {
  getAbsoluteMaxDcaOrders,
  MIN_DCA_ORDERS,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"

const PRICE_IMPACT_WARNING_THRESHOLD = -1

export enum DcaValidationError {
  PriceImpact = "PriceImpact",
  MinOrderBudget = "MinOrderBudget",
}

export enum DcaValidationWarning {
  PriceImpact = "PriceImpact",
}

export const useDcaValidation = (
  order: TradeDcaOrder | undefined | null,
  duration: TimeFrame,
): {
  readonly warnings: ReadonlyArray<DcaValidationWarning>
  readonly errors: ReadonlyArray<DcaValidationError>
} => {
  const {
    swap: {
      split: { twapSlippage },
    },
  } = useTradeSettings()

  if (!order) {
    return { warnings: [], errors: [] }
  }

  const priceImpact = order.tradeImpactPct

  const warnings: Array<DcaValidationWarning> = []
  const errors: Array<DcaValidationError> = []

  if (priceImpact < -twapSlippage) {
    errors.push(DcaValidationError.PriceImpact)
  } else if (priceImpact < PRICE_IMPACT_WARNING_THRESHOLD) {
    warnings.push(DcaValidationWarning.PriceImpact)
  }

  const maxOrders = getAbsoluteMaxDcaOrders(duration)

  if (
    order.tradeCount <= maxOrders &&
    order.tradeCount > Math.max(order.maxTradeCount, MIN_DCA_ORDERS)
  ) {
    errors.push(DcaValidationError.MinOrderBudget)
  }

  return { warnings, errors }
}

export const useOpenBudgetDcaHfValidation = (
  order: TradeDcaOrder | null | undefined,
  healthFactor: HealthFactorResult | undefined,
  isOpenBudget: boolean,
): HealthFactorResult | undefined => {
  const rpc = useRpcProvider()
  const { getAsset, isErc20AToken } = useAssets()

  const { account } = useAccount()
  const address = account?.address ?? ""

  const { data: aaveSummary } = useQuery(
    aaveSummaryQuery(rpc, address, isOpenBudget),
  )

  if (!order || !healthFactor || !isOpenBudget) {
    return
  }

  const assetIn = getAsset(order.assetIn)

  if (!assetIn || !isErc20AToken(assetIn)) {
    return
  }

  const reserve = aaveSummary?.reserves.find(
    (reserve) =>
      getAssetIdFromAddress(reserve.reserveAsset) === assetIn.underlyingAssetId,
  )

  return { ...healthFactor, isUserConsentRequired: !!reserve?.isCollateral }
}
