import { GSOL_ERC20_ID } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useMutation, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { prop } from "remeda"
import z from "zod/v4"

import {
  AAVE_GAS_LIMIT,
  healthFactorQuery,
  useTransfarebleATokenBalance,
} from "@/api/aave"
import { TAssetData } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import { StableSwapBase } from "@/api/pools"
import { bestSellWithTxQuery, Trade } from "@/api/trade"
import { calculateSlippage } from "@/api/utils/slippage"
import { TSelectedAsset } from "@/components/AssetSelect/AssetSelect"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { TRemoveStablepoolLiquidityFormValues } from "@/modules/liquidity/components/RemoveLiquidity/RemoveStablepoolLiquidity.utils"
import { calculatePoolFee } from "@/modules/liquidity/Liquidity.utils"
import { TReserve } from "@/modules/liquidity/Liquidity.utils"
import { useMaxBalance } from "@/modules/transactions/hooks/useMaxBalance"
import { AnyTransaction } from "@/modules/transactions/types"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import { useTransactionsStore } from "@/states/transactions"
import { scale, scaleHuman } from "@/utils/formatting"
import { positive, required, validateMaxBalance } from "@/utils/validators"

export const useRemoveMoneyMarketLiquidity = ({
  erc20Id,
  stableswapId,
  pool,
  reserves,
  onSubmitted,
}: {
  erc20Id: string
  stableswapId: string
  pool: StableSwapBase
  reserves: TReserve[]
  onSubmitted: () => void
}) => {
  const { getAssetWithFallback, isErc20AToken } = useAssets()
  const { t } = useTranslation("liquidity")

  const { getTransferableBalance } = useAccountBalances()
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const createTransaction = useTransactionsStore(prop("createTransaction"))
  const getMinimumTradeAmount = useMinimumTradeAmount()
  const {
    liquidity: { slippage },
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()

  const meta = getAssetWithFallback(erc20Id)

  const balance = getTransferableBalance(erc20Id)
  const balanceShifted = scaleHuman(balance.toString(), meta.decimals)
  const [maxATokenBalance, setMaxATokenBalance] = useState(balanceShifted)

  const initialReceiveAsset = reserves[0]?.meta

  const { data: feeEstimateTrade } = useQuery(
    bestSellWithTxQuery(rpc, {
      assetIn: erc20Id,
      assetOut: stableswapId,
      amountIn: "1",
      slippage: swapSlippage,
      address: account?.address ?? "",
    }),
  )

  const { form, maxBalanceWithFee } = useRemoveStablepoolLiquidityForm({
    receiveAsset: initialReceiveAsset!,
    asset: { ...meta, iconId: meta.id },
    maxBalance: maxATokenBalance,
    tx: feeEstimateTrade?.tx ?? null,
  })

  const [removeAmountShifted = "0", receiveAsset, split, receiveAmount] =
    form.watch(["amount", "receiveAsset", "split", "receiveAmount"])

  const removeAmount = Big(scale(removeAmountShifted, meta.decimals))

  const [debouncedAmountIn, isAmountInSynced] =
    useDebouncedValue(removeAmountShifted)
  const { data: quotedTrade, isLoading: isTradeLoading } = useQuery(
    bestSellWithTxQuery(rpc, {
      assetIn: erc20Id,
      assetOut: split ? stableswapId : receiveAsset.id,
      amountIn: debouncedAmountIn,
      slippage: swapSlippage,
      address: account?.address ?? "",
    }),
  )

  const trade = isAmountInSynced ? quotedTrade : undefined
  const isTradePending = isTradeLoading || !isAmountInSynced

  const amountOut = trade?.swap?.amountOut.toString() ?? "0"
  const amountOutShifted = scaleHuman(amountOut, receiveAsset.decimals)

  const tradeMinReceive = getMinimumTradeAmount(trade?.swap)?.toString() ?? "0"
  const tradeMinReceiveShifted = scaleHuman(
    tradeMinReceive,
    receiveAsset.decimals,
  )

  const getMinAssetsOut = useCallback(
    (value: string) => {
      const totalIssuance = pool.totalIssuance.toString()
      const fee = calculatePoolFee(pool.fee)
      const minReceive = Big(value)

      if (fee) {
        const totalDisplayAmount = reserves.reduce(
          (sum, reserve) => sum.plus(reserve.displayAmount),
          Big(0),
        )

        return reserves.map((reserve) => {
          const maxValue = minReceive
            .div(totalIssuance)
            .times(reserve.amount)
            .toFixed(0)

          const value = Big(maxValue)
            .minus(Big(slippage).times(maxValue).div(100))
            .toFixed(0)

          const ratio = totalDisplayAmount.gt(0)
            ? Big(reserve.displayAmount).div(totalDisplayAmount).toFixed(3)
            : "0"

          return { value, asset: reserve.meta, ratio }
        })
      }
    },
    [pool.totalIssuance, pool.fee, slippage, reserves],
  )

  const receiveAssetsProportionally = getMinAssetsOut(tradeMinReceive)

  const receiveErc20Asset = receiveAssetsProportionally?.find((asset) =>
    isErc20AToken(asset.asset),
  )
  const toAsset = split ? (receiveErc20Asset?.asset ?? null) : receiveAsset
  const toAmount = split
    ? scaleHuman(receiveErc20Asset?.value ?? "0", toAsset?.decimals ?? 0)
    : receiveAmount

  const { data: healthFactor } = useQuery(
    healthFactorQuery(rpc, {
      address: account?.address ?? "",
      fromAsset: meta,
      fromAmount: debouncedAmountIn,
      toAsset,
      toAmount,
    }),
  )

  const erc20ReserveRatio = split ? receiveErc20Asset?.ratio : "1"
  const { isLoading: isLoadingMaxBalance } = useTransfarebleATokenBalance({
    assetIn: meta,
    assetOut: toAsset,
    amountOutRatio: erc20ReserveRatio,
    onSuccess: setMaxATokenBalance,
  })

  useEffect(() => {
    if (!split) {
      form.setValue("receiveAmount", amountOutShifted, {
        shouldValidate: false,
      })
    }
  }, [amountOutShifted, form, split])

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!trade?.tx) throw new Error("Trade tx not found")
      if (!receiveAssetsProportionally)
        throw new Error("Receive assets not found")
      if (!account) throw new Error("Account not found")

      const { papi, sdk } = rpc

      const swapTx = trade?.tx

      // since gsol can have different trade routes, submit should be execetued in two steps
      if (erc20Id === GSOL_ERC20_ID && split) {
        const initialBalance = await getTransferableBalance(erc20Id)

        await createTransaction({
          tx: [
            {
              stepTitle: t("liquidity.remove.modal.stepper.sellAsset", {
                symbol: meta.symbol,
              }),
              tx: async () => {
                const tx = papi.tx.Dispatcher.dispatch_with_extra_gas({
                  call: swapTx.decodedCall,
                  extra_gas: AAVE_GAS_LIMIT,
                })

                const tOptions = {
                  value: debouncedAmountIn,
                  symbol: meta.symbol,
                }

                const toasts = {
                  submitted: t(
                    "liquidity.remove.sell.modal.toast.submitted",
                    tOptions,
                  ),
                  success: t(
                    "liquidity.remove.sell.modal.toast.success",
                    tOptions,
                  ),
                }

                return {
                  tx,
                  toasts,
                }
              },
            },
            {
              stepTitle: t("liquidity.remove.modal.stepper.withdrawLiquidity"),
              onSubmitted,
              tx: async () => {
                const { client } = sdk
                const { balance } = client

                const allShares = await balance.getBalance(
                  account?.address ?? "",
                  pool.id,
                )

                const diffShares = allShares.transferable - initialBalance

                const limits = getMinAssetsOut(diffShares.toString())?.map(
                  (minAssetOut) => {
                    return {
                      amount: BigInt(minAssetOut.value),
                      asset_id: Number(minAssetOut.asset.id),
                    }
                  },
                )

                if (!limits) throw new Error("Limits not found")

                const tOptions = {
                  value: removeAmountShifted,
                  symbol: t("shares"),
                  where: meta.symbol,
                }
                const toasts = {
                  submitted: t(
                    "liquidity.remove.moneyMarket.modal.toast.submitted",
                    tOptions,
                  ),
                  success: t(
                    "liquidity.remove.moneyMarket.modal.toast.success",
                    tOptions,
                  ),
                }

                const tx = papi.tx.Stableswap.remove_liquidity({
                  pool_id: Number(pool.id),
                  share_amount: BigInt(removeAmount.toFixed(0)),
                  min_amounts_out: limits,
                })

                return {
                  tx,
                  toasts: toasts,
                }
              },
            },
          ],
        })

        return
      }

      let tx: AnyTransaction | undefined

      if (split) {
        const txs = [
          swapTx,
          papi.tx.Stableswap.remove_liquidity({
            pool_id: Number(pool.id),
            share_amount: BigInt(removeAmount.toFixed(0)),
            min_amounts_out: receiveAssetsProportionally.map((asset) => ({
              amount: BigInt(asset.value),
              asset_id: Number(asset.asset.id),
            })),
          }),
        ]
        tx = papi.tx.Dispatcher.dispatch_with_extra_gas({
          call: papi.tx.Utility.batch_all({
            calls: txs.map((t) => t.decodedCall),
          }).decodedCall,
          extra_gas: AAVE_GAS_LIMIT,
        })
      } else {
        tx = swapTx
      }

      if (!tx) throw new Error("Transaction not found")

      const tOptions = {
        value: removeAmountShifted,
        symbol: t("shares"),
        where: meta.symbol,
      }
      const toasts = {
        submitted: t(
          "liquidity.remove.moneyMarket.modal.toast.submitted",
          tOptions,
        ),
        success: t(
          "liquidity.remove.moneyMarket.modal.toast.success",
          tOptions,
        ),
      }

      await createTransaction(
        {
          tx,
          toasts,
        },
        { onSubmitted },
      )
    },
  })

  return {
    form,
    balance: balanceShifted,
    maxBalanceWithFee,
    meta,
    reserves: reserves,
    receiveAssetsProportionally,
    receiveAsset,
    tradeMinReceive: tradeMinReceiveShifted,
    mutation,
    healthFactor,
    isLoadingMaxBalance,
    isTradePending,
    swap: trade?.swap,
  }
}

export const useMinimumTradeAmount = () => {
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()

  return (trade?: Trade) =>
    trade
      ? trade.amountOut - calculateSlippage(trade.amountOut, swapSlippage)
      : undefined
}

const useRemoveStablepoolLiquidityForm = ({
  asset,
  receiveAsset,
  maxBalance,
  tx,
}: {
  asset: TSelectedAsset
  receiveAsset: TAssetData
  maxBalance: string
  tx: AnyTransaction | null
}) => {
  const { t } = useTranslation("common")
  const { maxBalanceHuman } = useMaxBalance({
    assetId: asset.id,
    tx,
    balance: scale(maxBalance, asset.decimals),
  })

  const form = useForm<TRemoveStablepoolLiquidityFormValues>({
    mode: "onChange",
    defaultValues: {
      amount: "",
      asset,
      split: true,
      receiveAsset,
      receiveAmount: "",
    },
    resolver: standardSchemaResolver(
      z
        .object({
          amount: required.pipe(positive),
          asset: z.custom<TSelectedAsset>(),
          split: z.boolean(),
          receiveAsset: z.custom<TAssetData>(),
          receiveAmount: z.string(),
        })
        .refine((values) => validateMaxBalance(maxBalance, values.amount), {
          message: t("error.maxBalance"),
          path: ["amount"],
        }),
    ),
  })

  useEffect(() => {
    if (form.getValues("amount") !== "") {
      form.trigger("amount")
    }
  }, [maxBalance, form])

  return { maxBalanceWithFee: maxBalanceHuman, form }
}
