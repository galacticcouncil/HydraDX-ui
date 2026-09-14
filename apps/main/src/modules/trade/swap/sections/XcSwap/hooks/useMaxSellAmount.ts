import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"

import { useAccountBalances } from "@/api/balances"
import { useAccountFeePaymentAssetId } from "@/api/payments"
import { useMaxBalanceWithFee } from "@/modules/transactions/hooks/useMaxBalanceWithFee"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useIsIceEnabled } from "@/states/intents"
import { useTradeSettings } from "@/states/tradeSettings"
import { scaleHuman } from "@/utils/formatting"

export const useMaxSellAmount = ({
  assetIn,
  assetOut,
  // Off for a cross-chain destination, where assetOut is not a Hydration id
  enabled: isEnabled = true,
}: {
  assetIn: string
  assetOut: string
  enabled?: boolean
}) => {
  const { account } = useAccount()
  const { getAssetWithFallback } = useAssets()
  const { sdk, isReady } = useRpcProvider()
  const isIceEnabled = useIsIceEnabled()
  const {
    swap: {
      single: { swapSlippage },
      split: { twapSlippage, twapMaxRetries },
    },
  } = useTradeSettings()

  const { data: accountFeePaymentAssetId } = useAccountFeePaymentAssetId()
  const { getTransferableBalance, isBalanceLoading } = useAccountBalances()
  const enabled =
    isEnabled &&
    isReady &&
    !!account &&
    accountFeePaymentAssetId === Number(assetIn)

  const { data: tx, isPending: isTxPending } = useQuery({
    enabled,
    queryKey: [
      "maxSellAmount",
      assetIn,
      assetOut,
      swapSlippage,
      twapSlippage,
      twapMaxRetries,
      isIceEnabled,
    ],
    queryFn: async () => {
      const swap = await sdk.api.router.getBestSell(
        Number(assetIn),
        Number(assetOut),
        "1",
      )
      const twap = await sdk.api.scheduler.getTwapSellOrder(
        Number(assetIn),
        Number(assetOut),
        "1",
      )

      const swapTx = await sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(account?.address ?? "")
        .build()
        .then((tx) => tx.get())

      const twapBuilder = isIceEnabled
        ? sdk.tx.intentOrder(twap).withSlippage(twapSlippage)
        : sdk.tx
            .order(twap)
            .withSlippage(twapSlippage)
            .withMaxRetries(twapMaxRetries)

      const twapTx = await twapBuilder
        .withBeneficiary(account?.address ?? "")
        .build()
        .then((tx) => tx.get())

      return {
        swapTx,
        twapTx,
      }
    },
  })

  const maxSwapBalanceWithFee = useMaxBalanceWithFee(tx?.swapTx ?? null)
  const maxTwapBalanceWithFee = useMaxBalanceWithFee(tx?.twapTx ?? null)

  if (!enabled) {
    const balance = scaleHuman(
      getTransferableBalance(assetIn).toString(),
      getAssetWithFallback(assetIn).decimals,
    )

    return {
      maxSwapSellBalance: balance,
      maxTwapSellBalance: balance,
      isMaxSwapSellBalanceLoading: isBalanceLoading,
      isMaxTwapSellBalanceLoading: isBalanceLoading,
    }
  }

  return {
    maxSwapSellBalance: maxSwapBalanceWithFee?.maxBalanceHuman ?? "0",
    maxTwapSellBalance: maxTwapBalanceWithFee?.maxBalanceHuman ?? "0",
    isMaxSwapSellBalanceLoading: isTxPending || !maxSwapBalanceWithFee,
    isMaxTwapSellBalanceLoading: isTxPending || !maxTwapBalanceWithFee,
  }
}
