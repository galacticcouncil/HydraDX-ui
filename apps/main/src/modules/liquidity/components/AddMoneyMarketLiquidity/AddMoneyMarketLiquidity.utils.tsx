import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation, useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useEffect, useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { first, isNullish } from "remeda"

import {
  AAVE_GAS_LIMIT,
  healthFactorAfterWithdrawQuery,
  healthFactorQuery,
} from "@/api/aave"
import { omnipoolMiningPositionsKey, omnipoolPositionsKey } from "@/api/account"
import { useAccountBalances } from "@/api/balances"
import { useAccountFeePaymentAssetId } from "@/api/payments"
import { useOmnipoolIds } from "@/api/pools"
import { bestSellWithTxQuery } from "@/api/trade"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import {
  useCheckJoinOmnipoolFarm,
  useLiquidityOmnipoolShares,
} from "@/modules/liquidity/components/AddLiquidity/AddLiqudity.utils"
import { AddMoneyMarketLiquidityWrapperProps } from "@/modules/liquidity/components/AddStablepoolLiquidity/AddStablepoolLiquidity"
import {
  getStablepoolShares,
  TAddStablepoolLiquidityFormValues,
  useAssetsToAddToMoneyMarket,
  useStablepoolAddLiquidityForm,
} from "@/modules/liquidity/components/AddStablepoolLiquidity/AddStablepoolLiquidity.utils"
import { useMinimumTradeAmount } from "@/modules/liquidity/components/RemoveLiquidity/RemoveMoneyMarketLiquidity.utils"
import { useAddableStablepoolTokens } from "@/modules/liquidity/Liquidity.utils"
import { useFormMaxBalanceWithFee } from "@/modules/transactions/hooks/useFormMaxBalanceWithFee"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useTradeSettings } from "@/states/tradeSettings"
import {
  isSubstrateTxResult,
  useTransactionsStore,
} from "@/states/transactions"
import { scale, scaleHuman } from "@/utils/formatting"

export type TAddMoneyMarketLiquidityWrapperReturn = Omit<
  ReturnType<typeof useAddMoneyMarketLiquidityWrapper>,
  "form"
>

export const useAddMoneyMarketLiquidityWrapper = ({
  stablepoolDetails: { reserves },
  stableswapId,
  erc20Id,
  initialOption,
  split: initialSplit,
}: AddMoneyMarketLiquidityWrapperProps) => {
  const { getAssetWithFallback } = useAssets()
  const { account } = useAccount()
  const { sdk, isReady } = useRpcProvider()
  const { getTransferableBalance } = useAccountBalances()
  const {
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const { data: accountFeePaymentAssetId } = useAccountFeePaymentAssetId()
  const addableReserves = useAddableStablepoolTokens(stableswapId, reserves)
  const { data: omnipoolIds } = useOmnipoolIds()
  const isAddableToOmnipool = omnipoolIds?.includes(erc20Id)

  const stablepoolAssets = useMemo(() => {
    return reserves.map((reserve) => ({
      asset: reserve.meta,
      balance: reserve.amount,
    }))
  }, [reserves])

  const reserveIds = addableReserves.map((reserve) =>
    reserve.asset_id.toString(),
  )

  const { data: feeEstimationSwapTx } = useQuery({
    enabled:
      isReady && !!account?.address && !isNullish(accountFeePaymentAssetId),
    queryKey: [
      "addMoneyMarketLiquidityFeeEstimation",
      accountFeePaymentAssetId,
    ],
    queryFn: async () => {
      const swap = await sdk.api.router.getBestSell(
        accountFeePaymentAssetId ?? 0,
        Number(erc20Id),
        scaleHuman(
          getTransferableBalance(accountFeePaymentAssetId?.toString() ?? ""),
          getAssetWithFallback(accountFeePaymentAssetId?.toString() ?? "")
            .decimals,
        ),
      )

      return sdk.tx
        .trade(swap)
        .withSlippage(swapSlippage)
        .withBeneficiary(account?.address ?? "")
        .build()
        .then((tx) => tx.get())
    },
  })

  const { getMaxBalance } = useFormMaxBalanceWithFee(
    feeEstimationSwapTx ?? null,
  )

  const defaultOption =
    initialOption || (isAddableToOmnipool ? "omnipool" : "stablepool")

  const assetsToSelect = useAssetsToAddToMoneyMarket({
    stableswapId,
    reserves: addableReserves,
    options: {
      blacklist: defaultOption === "omnipool" ? [] : [erc20Id],
      firstAssetId: defaultOption === "omnipool" ? erc20Id : undefined,
    },
  })
  const initialAssetIdToAdd = assetsToSelect[0]?.id
  const enabledSplit = reserveIds.length > 1

  const form = useStablepoolAddLiquidityForm({
    stablepoolId: stableswapId,
    omnipoolId: isAddableToOmnipool ? erc20Id : stableswapId,
    selectedAssetId: initialAssetIdToAdd ?? "",
    getMaxBalance,
    option: defaultOption,
    activeFieldIds: reserveIds,
    split: !enabledSplit ? false : initialSplit,
  })

  const [split, selectedAssetId, activeFields] = form.watch([
    "split",
    "selectedAssetId",
    "activeFields",
  ])

  const meta = getAssetWithFallback(stableswapId)

  const assetsToProvide = activeFields
    .filter(({ amount }) => Big(amount || "0").gt(0))
    .map(({ assetId, amount }) => ({
      asset: getAssetWithFallback(assetId),
      amount,
    }))

  useEffect(() => {
    if (!selectedAssetId && initialAssetIdToAdd) {
      form.setValue("selectedAssetId", initialAssetIdToAdd, {
        shouldValidate: true,
      })
    }
  }, [form, initialAssetIdToAdd, selectedAssetId])

  return {
    form,
    getMaxBalance,
    assetsToSelect: split ? [] : assetsToSelect,
    meta,
    reserveIds,
    displayOption: false,
    assetsToProvide,
    stablepoolAssets,
    erc20Id,
    defaultOption,
    enabledSplit,
  }
}

export const useAddMoneyMarketOmnipoolLiquidity = ({
  formData,
  props,
}: {
  formData: TAddMoneyMarketLiquidityWrapperReturn
  props: AddMoneyMarketLiquidityWrapperProps
}) => {
  const { t } = useTranslation(["liquidity", "common"])
  const { getAssetWithFallback, isErc20AToken } = useAssets()
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const createTransaction = useTransactionsStore((s) => s.createTransaction)
  const {
    liquidity: { slippage },
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const { erc20Id, assetsToProvide, stablepoolAssets } = formData
  const {
    onSubmitted,
    stablepoolDetails: { pool },
  } = props
  const meta = getAssetWithFallback(erc20Id)
  const stableswapMeta = getAssetWithFallback(pool.id)
  const form = useFormContext<TAddStablepoolLiquidityFormValues>()
  const getMinimumTradeAmount = useMinimumTradeAmount()
  const getOmnipoolGetShares = useLiquidityOmnipoolShares(erc20Id)
  const { getTransferableBalance } = useAccountBalances()
  const { watch, setValue } = form
  const [split, selectedAssetId] = watch(["split", "selectedAssetId"])
  const isERC20Providing = selectedAssetId === erc20Id && !split

  const { assetIn, amounIn, minStablepoolShares } = (() => {
    if (split) {
      const stablepoolShares = getStablepoolShares(
        assetsToProvide,
        stablepoolAssets,
        pool,
      )

      const minStablepoolShares = Big(stablepoolShares)
        .times(100 - slippage)
        .div(100)
        .toFixed(0)

      const stablepoolSharesHuman =
        scaleHuman(minStablepoolShares, meta.decimals) || "0"

      const assetIn = props.stableswapId
      const amounIn = stablepoolSharesHuman

      return {
        assetIn,
        amounIn,
        minStablepoolShares,
      }
    } else if (isERC20Providing) {
      return {
        assetIn: "",
        amounIn: assetsToProvide[0]?.amount || "0",
        minStablepoolShares: "0",
      }
    } else {
      const tradeFormAsset = assetsToProvide[0]

      const assetIn = tradeFormAsset?.asset.id ?? selectedAssetId
      const amounIn = tradeFormAsset?.amount ?? "0"

      return {
        assetIn,
        amounIn,
        minStablepoolShares: "0",
      }
    }
  })()

  const [debouncedAmountIn, isAmountInSynced] = useDebouncedValue(amounIn)
  const { data: quotedTrade, isLoading: isTradeQueryLoading } = useQuery(
    bestSellWithTxQuery(rpc, {
      assetIn,
      assetOut: erc20Id,
      amountIn: debouncedAmountIn,
      slippage: swapSlippage,
      address: account?.address ?? "",
    }),
  )

  const trade = isAmountInSynced ? quotedTrade : undefined
  const isTradeLoading =
    !isERC20Providing && (isTradeQueryLoading || !isAmountInSynced)

  const minERC20ToGet = (() => {
    if (isERC20Providing) {
      return amounIn
    } else if (split) {
      // stablewap token is swapped 1:1 with erc20 token without slippage
      return scaleHuman(trade?.swap.amountOut ?? "0", meta.decimals)
    } else {
      return scaleHuman(
        getMinimumTradeAmount(trade?.swap)?.toString() ?? "0",
        meta.decimals,
      )
    }
  })()

  const { isJoinFarms, joinFarmErrorMessage, activeFarms } =
    useCheckJoinOmnipoolFarm({
      amount: minERC20ToGet,
      meta,
    })

  const omnipoolShares = getOmnipoolGetShares(minERC20ToGet)
  const minSharesToGet = omnipoolShares?.minSharesToGet ?? "0"
  const minReceiveAmount = scaleHuman(minSharesToGet, meta.decimals)
  const assetInMeta = getAssetWithFallback(assetIn)

  const { data: healthFactorQueryData } = useQuery(
    healthFactorAfterWithdrawQuery(rpc, {
      address: account?.address ?? "",
      fromAssetId: isErc20AToken(assetInMeta)
        ? assetInMeta.underlyingAssetId
        : "",
      fromAmount: debouncedAmountIn,
    }),
  )

  const healthFactor = isErc20AToken(assetInMeta)
    ? healthFactorQueryData
    : undefined

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!minSharesToGet) throw new Error("minReceiveAmount is not found")
      if (!account?.address) throw new Error("No account address")

      const { papi, sdk } = rpc
      const tradeTx = trade?.tx

      if (isERC20Providing) {
        const amountToJoinOmnipool = Big(
          scale(minERC20ToGet, meta.decimals),
        ).toFixed(0)

        const omnipoolTx = isJoinFarms
          ? papi.tx.OmnipoolLiquidityMining.add_liquidity_and_join_farms({
              asset: Number(erc20Id),
              amount: BigInt(amountToJoinOmnipool),
              min_shares_limit: BigInt(minSharesToGet),
              farm_entries: activeFarms.map((farm) => [
                farm.globalFarmId,
                farm.yieldFarmId,
              ]),
            })
          : papi.tx.Omnipool.add_liquidity_with_limit({
              asset: Number(erc20Id),
              amount: BigInt(amountToJoinOmnipool),
              min_shares_limit: BigInt(minSharesToGet),
            })

        const omnipoolDispatchTx = papi.tx.Dispatcher.dispatch_with_extra_gas({
          call: omnipoolTx.decodedCall,
          extra_gas: AAVE_GAS_LIMIT,
        })

        const tOptions = {
          value: t("common:currency", {
            value: minERC20ToGet,
            symbol: meta.symbol,
          }),
          where: t("omnipool"),
        }

        const joinOmnipoolToasts = {
          submitted: t(
            isJoinFarms
              ? "liquidity.add.joinFarms.modal.toast.submitted"
              : "liquidity.add.modal.toast.submitted",
            tOptions,
          ),
          success: t(
            isJoinFarms
              ? "liquidity.add.joinFarms.modal.toast.success"
              : "liquidity.add.modal.toast.success",
            tOptions,
          ),
        }
        await createTransaction(
          {
            tx: omnipoolDispatchTx,
            toasts: joinOmnipoolToasts,
            invalidateQueries: [
              omnipoolPositionsKey(account?.address ?? ""),
              omnipoolMiningPositionsKey(account?.address ?? ""),
            ],
          },
          { onSubmitted },
        )
      } else if (split) {
        const initialShares = getTransferableBalance(pool.id.toString())

        await createTransaction({
          tx: [
            {
              stepTitle: t("liquidity.add.modal.stepper.addLiquidity"),
              tx: async () => {
                // provide liquidity and get stableswap shares
                const assetsToProvideFormatted = assetsToProvide.map(
                  ({ asset, amount }) => ({
                    asset_id: Number(asset.id),
                    amount: BigInt(scale(amount, asset.decimals)),
                  }),
                )

                const tx = papi.tx.Dispatcher.dispatch_with_extra_gas({
                  call: papi.tx.Stableswap.add_assets_liquidity({
                    pool_id: pool.id,
                    assets: assetsToProvideFormatted,
                    min_shares: BigInt(minStablepoolShares),
                  }).decodedCall,
                  extra_gas: AAVE_GAS_LIMIT,
                })

                const providedValue = assetsToProvide
                  .map(({ asset, amount }) =>
                    t("common:currency", {
                      value: amount,
                      symbol: asset.symbol,
                    }),
                  )
                  .join(", ")

                const tOptions = {
                  value: providedValue,
                  where: stableswapMeta.symbol,
                }

                const toasts = {
                  submitted: t("liquidity.add.modal.toast.submitted", tOptions),
                  success: t("liquidity.add.modal.toast.success", tOptions),
                }

                return {
                  title: t("liquidity.add.modal.stepper.addLiquidity"),
                  tx,
                  toasts,
                }
              },
            },
            {
              stepTitle: t("liquidity.add.modal.stepper.joinOmnipool"),
              onSubmitted,
              tx: async (results) => {
                const addingSharesResult = results[0]

                let addedShares = 0n

                if (
                  addingSharesResult &&
                  isSubstrateTxResult(addingSharesResult)
                ) {
                  addedShares =
                    papi.event.Stableswap.LiquidityAdded.filter(
                      addingSharesResult.events,
                    ).find((event) => event.payload.who === account?.address)
                      ?.payload.shares ?? 0n
                } else {
                  const { client } = sdk
                  const { balance } = client

                  const shares = await balance.getBalance(
                    account?.address ?? "",
                    pool.id,
                  )

                  addedShares = shares.transferable - initialShares
                }

                const addedSharesShifted = scaleHuman(
                  addedShares.toString(),
                  stableswapMeta.decimals,
                ).toString()

                const swap = await sdk.api.router.getBestSell(
                  pool.id,
                  Number(erc20Id),
                  addedSharesShifted,
                )

                // swap stableswap shares to erc20 token
                const swapTx = await sdk.tx
                  .trade(swap)
                  .withSlippage(slippage)
                  .withBeneficiary(account.address)
                  .build()
                  .then((tx) => tx.get())

                const minSharesToGet =
                  getOmnipoolGetShares(addedSharesShifted)?.minSharesToGet

                if (!minSharesToGet)
                  throw new Error("minSharesToGet is not found")

                const omnipoolTx = isJoinFarms
                  ? papi.tx.OmnipoolLiquidityMining.add_liquidity_and_join_farms(
                      {
                        asset: Number(erc20Id),
                        amount: BigInt(addedShares),
                        min_shares_limit: BigInt(minSharesToGet),
                        farm_entries: activeFarms.map((farm) => [
                          farm.globalFarmId,
                          farm.yieldFarmId,
                        ]),
                      },
                    )
                  : papi.tx.Omnipool.add_liquidity_with_limit({
                      asset: Number(erc20Id),
                      amount: BigInt(addedShares),
                      min_shares_limit: BigInt(minSharesToGet),
                    })

                const omnipoolDispatchTx =
                  papi.tx.Dispatcher.dispatch_with_extra_gas({
                    call: omnipoolTx.decodedCall,
                    extra_gas: AAVE_GAS_LIMIT,
                  })

                const tOptions = {
                  value: t("common:currency", {
                    value: addedSharesShifted,
                    symbol: meta.symbol,
                  }),
                  where: t("omnipool"),
                }

                const joinOmnipoolToasts = {
                  submitted: t(
                    isJoinFarms
                      ? "liquidity.add.joinFarms.modal.toast.submitted"
                      : "liquidity.add.modal.toast.submitted",
                    tOptions,
                  ),
                  success: t(
                    isJoinFarms
                      ? "liquidity.add.joinFarms.modal.toast.success"
                      : "liquidity.add.modal.toast.success",
                    tOptions,
                  ),
                }

                // join omnipool with erc20 token
                const tx = papi.tx.Utility.batch_all({
                  calls: [swapTx, omnipoolDispatchTx].map((t) => t.decodedCall),
                })

                return {
                  tx,
                  title: t("liquidity.add.modal.stepper.getAsset", {
                    symbol: meta.symbol,
                  }),
                  toasts: joinOmnipoolToasts,
                  invalidateQueries: [
                    omnipoolPositionsKey(account?.address ?? ""),
                    omnipoolMiningPositionsKey(account?.address ?? ""),
                  ],
                }
              },
            },
          ],
        })
      } else {
        if (!tradeTx) throw new Error("Trade not found")
        const initialGethBalance = await getTransferableBalance(erc20Id)

        await createTransaction({
          tx: [
            {
              stepTitle: t("liquidity.add.modal.stepper.addLiquidity"),
              tx: async () => {
                const tOptions = {
                  value: t("common:currency", {
                    value: minERC20ToGet,
                    symbol: meta.symbol,
                  }),
                  where: meta.symbol,
                }

                const toasts = {
                  submitted: t("liquidity.add.modal.toast.submitted", tOptions),
                  success: t("liquidity.add.modal.toast.success", tOptions),
                }

                return {
                  title: t("liquidity.add.modal.stepper.addLiquidity"),
                  tx: tradeTx,
                  toasts,
                }
              },
            },
            {
              stepTitle: t("liquidity.add.modal.stepper.joinOmnipool"),
              onSubmitted,
              tx: async () => {
                const { client } = sdk
                const { balance } = client

                const shares = await balance.getBalance(
                  account?.address ?? "",
                  Number(erc20Id),
                )

                const addedGeth = shares.transferable - initialGethBalance
                const addedGethShifted = scaleHuman(
                  addedGeth.toString(),
                  meta.decimals,
                )
                const minSharesToGet =
                  getOmnipoolGetShares(addedGethShifted)?.minSharesToGet

                if (!minSharesToGet)
                  throw new Error("minSharesToGet is not found")

                const omnipoolTx = isJoinFarms
                  ? papi.tx.OmnipoolLiquidityMining.add_liquidity_and_join_farms(
                      {
                        asset: Number(erc20Id),
                        amount: BigInt(addedGeth),
                        min_shares_limit: BigInt(minSharesToGet),
                        farm_entries: activeFarms.map((farm) => [
                          farm.globalFarmId,
                          farm.yieldFarmId,
                        ]),
                      },
                    )
                  : papi.tx.Omnipool.add_liquidity_with_limit({
                      asset: Number(erc20Id),
                      amount: BigInt(addedGeth),
                      min_shares_limit: BigInt(minSharesToGet),
                    })

                const tx = papi.tx.Dispatcher.dispatch_with_extra_gas({
                  call: omnipoolTx.decodedCall,
                  extra_gas: AAVE_GAS_LIMIT,
                })

                const tOptions = {
                  value: t("common:currency", {
                    value: addedGethShifted,
                    symbol: meta.symbol,
                  }),
                  where: t("omnipool"),
                }

                const joinOmnipoolToasts = {
                  submitted: t(
                    isJoinFarms
                      ? "liquidity.add.joinFarms.modal.toast.submitted"
                      : "liquidity.add.modal.toast.submitted",
                    tOptions,
                  ),
                  success: t(
                    isJoinFarms
                      ? "liquidity.add.joinFarms.modal.toast.success"
                      : "liquidity.add.modal.toast.success",
                    tOptions,
                  ),
                }

                return {
                  tx,
                  title: t("liquidity.add.modal.stepper.joinOmnipool"),
                  toasts: joinOmnipoolToasts,
                  invalidateQueries: [
                    omnipoolPositionsKey(account?.address ?? ""),
                    omnipoolMiningPositionsKey(account?.address ?? ""),
                  ],
                }
              },
            },
          ],
        })
      }
    },
  })

  useEffect(() => {
    setValue("sharesAmount", minReceiveAmount, {
      shouldValidate: true,
    })
  }, [setValue, minReceiveAmount])

  return {
    joinFarmErrorMessage,
    isJoinFarms,
    activeFarms,
    mutation,
    minReceiveAmount,
    healthFactor,
    poolShare: omnipoolShares?.poolShare,
    isAddableToOmnipool: true,
    isTradeLoading,
    swap: trade?.swap,
    ...formData,
    meta,
  }
}

export const useAddMoneyMarketLiquidity = ({
  formData,
  props,
}: {
  formData: TAddMoneyMarketLiquidityWrapperReturn
  props: AddMoneyMarketLiquidityWrapperProps
}) => {
  const { t } = useTranslation(["liquidity", "common"])
  const { getAssetWithFallback } = useAssets()
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const createTransaction = useTransactionsStore((s) => s.createTransaction)
  const { getTransferableBalance } = useAccountBalances()
  const {
    liquidity: { slippage },
    swap: {
      single: { swapSlippage },
    },
  } = useTradeSettings()
  const form = useFormContext<TAddStablepoolLiquidityFormValues>()
  const getMinimumTradeAmount = useMinimumTradeAmount()

  const { papi, sdk } = rpc
  const { erc20Id, assetsToProvide, stablepoolAssets } = formData
  const {
    stableswapId,
    stablepoolDetails: { pool },
    onSubmitted,
  } = props

  const meta = getAssetWithFallback(stableswapId)
  const erc20Meta = getAssetWithFallback(erc20Id)
  const { setValue, watch } = form

  const [split, selectedAssetId] = watch(["split", "selectedAssetId"])

  const stablepoolShares = getStablepoolShares(
    assetsToProvide,
    stablepoolAssets,
    pool,
  )

  const minStablepoolShares = Big(stablepoolShares)
    .times(100 - slippage)
    .div(100)
    .toFixed(0)

  const stablepoolSharesHuman =
    scaleHuman(minStablepoolShares, meta.decimals) || "0"

  const { assetIn, amounIn } = (() => {
    if (split) {
      return {
        assetIn: stableswapId,
        amounIn: stablepoolSharesHuman,
      }
    } else {
      const tradeFormAsset = assetsToProvide[0]

      return {
        assetIn: tradeFormAsset?.asset.id ?? selectedAssetId,
        amounIn: tradeFormAsset?.amount ?? "0",
      }
    }
  })()

  const [debouncedAmountIn, isAmountInSynced] = useDebouncedValue(amounIn)
  const { data: quotedTrade, isLoading: isTradeQueryLoading } = useQuery(
    bestSellWithTxQuery(rpc, {
      assetIn,
      assetOut: erc20Id,
      amountIn: debouncedAmountIn,
      slippage: swapSlippage,
      address: account?.address ?? "",
    }),
  )

  const trade = isAmountInSynced ? quotedTrade : undefined
  const isTradeLoading = isTradeQueryLoading || !isAmountInSynced

  const tradeAmountOut = split
    ? (trade?.swap.amountOut ?? "0")
    : (getMinimumTradeAmount(trade?.swap)?.toString() ?? "0")
  const minReceiveAmount = scaleHuman(tradeAmountOut, meta.decimals)

  //@TODO: decide how to display health factor when providing liquidity to shares and then trade to erc20
  const { data: healthFactor } = useQuery(
    healthFactorQuery(rpc, {
      address: account?.address ?? "",
      fromAsset: getAssetWithFallback(assetIn),
      fromAmount: debouncedAmountIn,
      toAsset: getAssetWithFallback(erc20Id),
      toAmount: minReceiveAmount,
    }),
  )

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!account?.address) throw new Error("No account address")
      if (!assetsToProvide.length) throw new Error("No assets to provide")

      if (split) {
        const assetsToProvideFormatted = assetsToProvide.map(
          ({ asset, amount }) => ({
            asset_id: Number(asset.id),
            amount: BigInt(scale(amount, asset.decimals)),
          }),
        )
        const initialShares = getTransferableBalance(pool.id.toString())

        const firstTx = papi.tx.Dispatcher.dispatch_with_extra_gas({
          call: papi.tx.Stableswap.add_assets_liquidity({
            pool_id: pool.id,
            assets: assetsToProvideFormatted,
            min_shares: BigInt(minStablepoolShares),
          }).decodedCall,
          extra_gas: AAVE_GAS_LIMIT,
        })

        const providedValue = assetsToProvide
          .map(({ asset, amount }) =>
            t("common:currency", {
              value: amount,
              symbol: asset.symbol,
            }),
          )
          .join(", ")

        await createTransaction({
          tx: [
            {
              stepTitle: t("liquidity.add.modal.stepper.addLiquidity"),
              tx: async () => {
                const tOptions = {
                  value: providedValue,
                  where: meta.symbol,
                }

                const toasts = {
                  submitted: t("liquidity.add.modal.toast.submitted", tOptions),
                  success: t("liquidity.add.modal.toast.success", tOptions),
                }

                return {
                  title: t("liquidity.add.modal.stepper.addLiquidity"),
                  tx: firstTx,
                  toasts,
                }
              },
            },
            {
              stepTitle: t("liquidity.add.modal.stepper.getAsset", {
                symbol: erc20Meta.symbol,
              }),
              onSubmitted,
              tx: async (results) => {
                const addingSharesResult = results[0]

                let addedShares = 0n

                if (
                  addingSharesResult &&
                  isSubstrateTxResult(addingSharesResult)
                ) {
                  addedShares =
                    papi.event.Stableswap.LiquidityAdded.filter(
                      addingSharesResult.events,
                    ).find((event) => event.payload.who === account.address)
                      ?.payload.shares ?? 0n
                } else {
                  const { client } = sdk
                  const { balance } = client

                  const shares = await balance.getBalance(
                    account.address,
                    pool.id,
                  )

                  addedShares = shares.transferable - initialShares
                }

                const addedSharesShifted = scaleHuman(
                  addedShares.toString(),
                  meta.decimals,
                ).toString()

                const swap = await sdk.api.router.getBestSell(
                  Number(stableswapId),
                  Number(erc20Id),
                  addedSharesShifted,
                )

                const swapTx = await sdk.tx
                  .trade(swap)
                  .withSlippage(slippage)
                  .withBeneficiary(account.address)
                  .build()
                  .then((tx) => tx.get())

                const tOptions = {
                  value: providedValue,
                  where: erc20Meta.symbol,
                }

                const toasts = {
                  submitted: t("liquidity.add.modal.toast.submitted", tOptions),
                  success: t("liquidity.add.modal.toast.success", tOptions),
                }

                return {
                  tx: swapTx,
                  title: t("liquidity.add.modal.stepper.getAsset", {
                    symbol: erc20Meta.symbol,
                  }),
                  toasts,
                }
              },
            },
          ],
        })
      } else {
        if (!trade?.tx) throw new Error("Trade not found")

        const providedValue = first(
          assetsToProvide.map(({ asset, amount }) =>
            t("common:currency", {
              value: amount,
              symbol: asset.symbol,
            }),
          ),
        )

        const tOptions = {
          value: providedValue,
          where: erc20Meta.symbol,
        }

        const toasts = {
          submitted: t("liquidity.add.modal.toast.submitted", tOptions),
          success: t("liquidity.add.modal.toast.success", tOptions),
        }

        await createTransaction(
          {
            tx: trade.tx,
            toasts,
          },
          { onSubmitted },
        )
      }
    },
  })

  useEffect(() => {
    setValue("sharesAmount", minReceiveAmount, {
      shouldValidate: true,
    })
  }, [setValue, minReceiveAmount])

  return {
    mutation,
    activeFarms: [],
    joinFarmErrorMessage: undefined,
    isJoinFarms: false,
    poolShare: "",
    minReceiveAmount,
    healthFactor: Big(debouncedAmountIn).gt(0) ? healthFactor : undefined,
    isAddableToOmnipool: false,
    isTradeLoading,
    swap: split ? undefined : trade?.swap,
    ...formData,
  }
}
