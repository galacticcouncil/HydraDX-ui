import {
  ComputedUserReserveData,
  ExtendedFormattedUser,
  getAssetCapData,
  useProtocolActionToasts,
} from "@galacticcouncil/money-market/hooks"
import { queryKeysFactory } from "@galacticcouncil/money-market/ui-config"
import { CustomToastAction } from "@galacticcouncil/money-market/ui-config"
import {
  getAssetCollateralType,
  isShowIsolationWarning,
} from "@galacticcouncil/money-market/utils"
import { safeConvertAnyToH160 } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Big from "big.js"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { first, isNullish } from "remeda"
import z from "zod"

import { healthFactorQuery } from "@/api/aave"
import { TAssetData, TErc20AToken } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import {
  lendingPoolAddressProvider,
  useBorrowAssetsApy,
  useBorrowDisableCollateralTxs,
  userBorrowSummaryQueryKey,
  useSetUsageAsCollateralTx,
} from "@/api/borrow"
import { useAccountFeePaymentAssetId } from "@/api/payments"
import { spotPriceQuery } from "@/api/spotPrice"
import { bestSellWithTxQuery } from "@/api/trade"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useMinimumTradeAmount } from "@/modules/liquidity/components/RemoveLiquidity/RemoveMoneyMarketLiquidity.utils"
import { useCreateBatchTx } from "@/modules/transactions/hooks/useBatchTx"
import {
  useFormMaxBalanceWithFee,
  ValidateFormMaxBalanceWithFee,
} from "@/modules/transactions/hooks/useFormMaxBalanceWithFee"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { scaleHuman } from "@/utils/formatting"

export type TSupplyIsolatedLiquidityFormValues = {
  amount: string
  asset: TAssetData
}

export const useSupplyIsolatedLiquidity = ({
  initialAsset,
  aToken,
  userBorrowData,
  userReserve,
  onSubmitted,
  supplyAssetId,
}: {
  supplyAssetId: string
  initialAsset: TAssetData
  aToken: TErc20AToken
  userBorrowData: ExtendedFormattedUser
  userReserve: ComputedUserReserveData
  onSubmitted: () => void
}) => {
  const { t } = useTranslation("common")
  const rpc = useRpcProvider()
  const { sdk, isReady } = rpc
  const { account } = useAccount()
  const { getAssetWithFallback } = useAssets()
  const { getTransferableBalance } = useAccountBalances()
  const { data: accountFeePaymentAssetId } = useAccountFeePaymentAssetId()
  const createBatch = useCreateBatchTx()
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const queryClient = useQueryClient()
  const { usageAsCollateralEnabledOnUser, reserve, underlyingAsset } =
    userReserve

  const { data: feeEstimationSwapTx } = useQuery({
    enabled:
      isReady && !!account?.address && !isNullish(accountFeePaymentAssetId),
    queryKey: [
      "supplyIsolatedLiquidityFeeEstimation",
      accountFeePaymentAssetId,
      aToken.id,
    ],
    queryFn: async () => {
      const swap = await sdk.api.router.getBestSell(
        accountFeePaymentAssetId ?? 0,
        Number(aToken.id),
        scaleHuman(
          getTransferableBalance(accountFeePaymentAssetId?.toString() ?? ""),
          getAssetWithFallback(accountFeePaymentAssetId?.toString() ?? "")
            .decimals,
        ),
      )

      const swapTx = await sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(account?.address ?? "")
        .build()
        .then((tx) => tx.get())

      const txs = [swapTx]

      if (!usageAsCollateralEnabledOnUser) {
        const disableCollateralsTxs = await getDisableCollateralsTxs()

        txs.push(...(disableCollateralsTxs ?? []))

        const enableCollateralTx = await getSetUsageAsCollateralTx(
          underlyingAsset,
          true,
        )
        txs.push(enableCollateralTx)
      }

      return txs.length > 1
        ? rpc.papi.tx.Utility.batch_all({
            calls: txs.map((tx) => tx.decodedCall),
          })
        : swapTx
    },
  })

  const { getMaxBalance, validateBalance } = useFormMaxBalanceWithFee(
    feeEstimationSwapTx ?? null,
  )

  const form = useSupplyIsolatedLiquidityForm({
    asset: initialAsset,
    validateBalance,
  })
  const getMinimumTradeAmount = useMinimumTradeAmount()
  const getDisableCollateralsTxs = useBorrowDisableCollateralTxs()
  const getSetUsageAsCollateralTx = useSetUsageAsCollateralTx()
  const { data: assetsApy } = useBorrowAssetsApy([supplyAssetId])

  const apys =
    first(assetsApy)?.underlyingAssetsApyData.map((apyData) => ({
      apy: apyData.supplyApy,
      apyType: apyData.apyType,
    })) ?? []

  const assetCap = getAssetCapData(reserve)

  const [amountIn, assetIn] = form.watch(["amount", "asset"])

  const maxBalance = getMaxBalance(assetIn)
  const isAaveSupply = aToken.underlyingAssetId === assetIn.id

  const { data: spotPriceData, isLoading: isPriceLoading } = useQuery({
    ...spotPriceQuery(rpc, assetIn.id, aToken.id),
    enabled: !isAaveSupply,
  })

  const [debouncedAmountIn, isAmountInSynced] = useDebouncedValue(amountIn)

  const collateralType = getAssetCollateralType(
    userReserve,
    userBorrowData.totalCollateralUSD,
    userBorrowData.isInIsolationMode,
    assetCap.debtCeiling.isMaxed,
  )

  const isBorrowedAssets = Big(
    userBorrowData.totalBorrowsMarketReferenceCurrency,
  ).gt(0)

  const activeCollaterals = !usageAsCollateralEnabledOnUser
    ? userBorrowData.userReservesData.filter(
        (reserve) => reserve.usageAsCollateralEnabledOnUser,
      )
    : []
  const isActiveColalterals = activeCollaterals.length > 0

  const isBlockedByBorrowedAssets = isBorrowedAssets && isActiveColalterals

  const isEnablingIsolatedModeWarning =
    isActiveColalterals && !isBlockedByBorrowedAssets

  const isolationWarning = isShowIsolationWarning(
    userBorrowData,
    userReserve.reserve,
    userReserve,
  )

  const supplyCapWarning = assetCap.supplyCap.determineWarningDisplay({
    supplyCap: assetCap.supplyCap,
  })

  const debtCeilingWarning = assetCap.debtCeiling.determineWarningDisplay({
    debtCeiling: assetCap.debtCeiling,
  })

  const isBlockedSupply =
    isBlockedByBorrowedAssets || !!supplyCapWarning || !!debtCeilingWarning

  const { data: quotedTrade, isLoading: isTradeQueryLoading } = useQuery(
    bestSellWithTxQuery(rpc, {
      assetIn: assetIn.id,
      assetOut: aToken.id,
      amountIn: isBlockedSupply ? "0" : debouncedAmountIn,
      slippage: swapSlippage,
      address: account?.address ?? "",
    }),
  )

  const trade = isAmountInSynced ? quotedTrade : undefined
  const isTradeLoading = isTradeQueryLoading || !isAmountInSynced

  const minReceiveAmount =
    (isAaveSupply
      ? trade?.swap.amountOut
      : getMinimumTradeAmount(trade?.swap)?.toString()) ?? "0"
  const minReceiveAmountShifted = scaleHuman(minReceiveAmount, aToken.decimals)

  const { data: healthFactor, isPlaceholderData: isHealthFactorStale } =
    useQuery(
      healthFactorQuery(rpc, {
        address: account?.address ?? "",
        fromAsset: assetIn,
        fromAmount: debouncedAmountIn,
        toAsset: isBlockedSupply ? null : aToken,
        toAmount: minReceiveAmountShifted,
      }),
    )

  const isHealthFactorLoading =
    !isBlockedSupply && (isTradeLoading || isHealthFactorStale)

  const toasts = useProtocolActionToasts(CustomToastAction.supplyIsolated, {
    value: t("currency", {
      value: minReceiveAmountShifted,
      symbol: aToken.symbol,
    }),
  })

  const onSubmit = async () => {
    if (!trade?.tx) throw new Error("Trade not found")
    const txs = [trade.tx]

    if (!usageAsCollateralEnabledOnUser) {
      const disableCollateralsTxs = await getDisableCollateralsTxs()

      txs.push(...(disableCollateralsTxs ?? []))

      const enableCollateralTx = await getSetUsageAsCollateralTx(
        underlyingAsset,
        true,
      )
      txs.push(enableCollateralTx)
    }

    await createBatch({
      txs,
      transaction: { toasts },
      options: {
        onSubmitted,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeysFactory.pool })
          queryClient.invalidateQueries({
            queryKey: userBorrowSummaryQueryKey(
              safeConvertAnyToH160(account?.address ?? ""),
              lendingPoolAddressProvider,
            ),
          })
        },
      },
    })
  }

  return {
    form,
    maxBalance,
    onSubmit,
    collateralType,
    healthFactor,
    isHealthFactorLoading,
    isolationWarning,
    supplyCapWarning,
    debtCeilingWarning,
    isBlockedByBorrowedAssets,
    isEnablingIsolatedModeWarning,
    isBlockedSupply,
    minReceiveAmountShifted,
    apys,
    spotPriceData,
    isPriceLoading,
    isAaveSupply,
    isTradeLoading,
    swap: trade?.swap,
  }
}

const useSupplyIsolatedLiquidityForm = ({
  asset,
  validateBalance,
}: {
  asset: TAssetData
  validateBalance: ValidateFormMaxBalanceWithFee
}) => {
  return useForm<TSupplyIsolatedLiquidityFormValues>({
    mode: "onChange",
    defaultValues: {
      amount: "",
      asset,
    },
    resolver: standardSchemaResolver(
      z
        .object({
          amount: z.string(),
          asset: z.custom<TAssetData>(),
        })
        .check(validateBalance("amount", (form) => [form.asset, form.amount])),
    ),
  })
}
