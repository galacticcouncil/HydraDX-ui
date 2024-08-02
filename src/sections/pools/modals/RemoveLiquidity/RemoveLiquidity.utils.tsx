import { useOraclePrice } from "api/farms"
import { useOmnipoolAssets } from "api/omnipool"
import { useSpotPrice } from "api/spotPrice"
import { useRpcProvider } from "providers/rpcProvider"
import { useCallback, useMemo } from "react"
import { BN_0 } from "utils/constants"
import BN from "bignumber.js"
import {
  calculate_lrna_spot_price,
  calculate_withdrawal_fee,
} from "@galacticcouncil/math-omnipool"
import { scaleHuman } from "utils/balance"
import { useMinWithdrawalFee } from "api/consts"
import { useMutation } from "@tanstack/react-query"
import { ToastMessage, useStore } from "state/store"
import { TOAST_MESSAGES } from "state/toasts"
import { Trans, useTranslation } from "react-i18next"
import { TLPData, useLiquidityPositionData } from "utils/omnipool"
import { useAssets } from "providers/assets"
import { usePoolData } from "sections/pools/pool/Pool"

export type RemoveLiquidityProps = {
  onClose: () => void
  position: TLPData | TLPData[]
  onSuccess: () => void
  onSubmitted?: (tokensToGet: string) => void
}

const defaultValues = {
  tokensToGet: BN_0,
  tokensToGetShifted: BN_0,
  lrnaToGet: BN_0,
  lrnaPayWith: BN_0,
  tokensPayWith: BN_0,
  withdrawalFee: BN_0,
  minWithdrawalFee: BN_0,
}

export const useRemoveLiquidity = (
  position: TLPData | TLPData[],
  percentage: number,
  onClose: () => void,
  onSuccess: () => void,
  onSubmit: (value: string) => void,
) => {
  const { t } = useTranslation()
  const { createTransaction } = useStore()
  const { api } = useRpcProvider()
  const { hub } = useAssets()
  const { pool } = usePoolData()

  const isPositionMultiple = Array.isArray(position)

  const assetId = pool.id

  const meta = pool.meta
  const hubMeta = hub

  const spotPrice = useSpotPrice(hubMeta.id, assetId)
  const oracle = useOraclePrice(assetId, hubMeta.id)
  const minlFeeQuery = useMinWithdrawalFee()
  const { getData } = useLiquidityPositionData([assetId])
  const omnipoolAssets = useOmnipoolAssets()
  const omnipoolAsset = omnipoolAssets.data?.find(
    (omnipoolAsset) => omnipoolAsset.id === assetId,
  )

  const { removeShares, totalValue, removeValue } = useMemo(() => {
    if (isPositionMultiple) {
      const totalShares = position.reduce(
        (acc, pos) => acc.plus(pos.shares),
        BN_0,
      )

      const totalRemoveValue = position.reduce(
        (acc, pos) => acc.plus(pos.totalValueShifted),
        BN_0,
      )
      return {
        removeShares: totalShares,
        removeValue: totalRemoveValue,
        totalValue: totalRemoveValue,
      }
    }

    const totalShares = position.shares

    return {
      totalValue: position.totalValueShifted,
      removeValue: position.totalValueShifted.div(100).times(percentage),
      removeShares: totalShares.div(100).times(percentage),
    }
  }, [isPositionMultiple, position, percentage])

  const calculateLiquidityValues = useCallback(
    (position: TLPData, removeSharesValue: BN) => {
      if (omnipoolAsset && spotPrice.data && oracle.data && minlFeeQuery.data) {
        const oraclePrice = oracle.data.oraclePrice ?? BN_0
        const minWithdrawalFee = minlFeeQuery.data

        const lrnaSpotPrice = calculate_lrna_spot_price(
          omnipoolAsset.balance.toString(),
          omnipoolAsset.data.hubReserve.toString(),
        )

        const withdrawalFee = calculate_withdrawal_fee(
          lrnaSpotPrice,
          oraclePrice.toString(),
          minWithdrawalFee.toString(),
        )

        if (removeSharesValue.isZero()) {
          return {
            ...defaultValues,
            withdrawalFee: scaleHuman(withdrawalFee, "q").multipliedBy(100),
            minWithdrawalFee,
          }
        }

        const valueWithFee = getData(position, {
          fee: withdrawalFee,
          sharesValue: removeSharesValue.toFixed(0),
        })

        const valueWithoutFee = getData(position, {
          sharesValue: removeSharesValue.toFixed(0),
        })

        if (!valueWithFee || !valueWithoutFee) return undefined

        return {
          tokensToGet: valueWithFee.value,
          tokensToGetShifted: valueWithFee.valueShifted,
          lrnaToGet: valueWithFee.lrnaShifted,
          lrnaPayWith: valueWithoutFee.lrnaShifted.minus(
            valueWithFee.lrnaShifted,
          ),
          tokensPayWith: valueWithoutFee.valueShifted.minus(
            valueWithFee.valueShifted,
          ),
          withdrawalFee: scaleHuman(withdrawalFee, "q").multipliedBy(100),
          minWithdrawalFee,
        }
      }
    },
    [getData, minlFeeQuery.data, omnipoolAsset, oracle.data, spotPrice.data],
  )

  const values = useMemo(() => {
    if (isPositionMultiple) {
      return position.reduce((acc, pos) => {
        const values = calculateLiquidityValues(pos, pos.shares)

        if (values) {
          return {
            tokensToGet: acc.tokensToGet.plus(values.tokensToGet),
            tokensToGetShifted: acc.tokensToGetShifted.plus(
              values.tokensToGetShifted,
            ),
            lrnaToGet: acc.lrnaToGet.plus(values.lrnaToGet),
            lrnaPayWith: acc.lrnaPayWith.plus(values.lrnaPayWith),
            tokensPayWith: acc.tokensPayWith.plus(values.tokensPayWith),
            withdrawalFee: values.withdrawalFee,
            minWithdrawalFee: values.minWithdrawalFee,
          }
        }

        return acc
      }, defaultValues)
    }

    return calculateLiquidityValues(position, removeShares)
  }, [calculateLiquidityValues, isPositionMultiple, position, removeShares])

  const mutation = useMutation(async () => {
    if (isPositionMultiple) {
      const toast = TOAST_MESSAGES.reduce((memo, type) => {
        const msType = type === "onError" ? "onLoading" : type
        memo[type] = (
          <Trans t={t} i18nKey={`liquidity.remove.modal.all.toast.${msType}`}>
            <span />
          </Trans>
        )
        return memo
      }, {} as ToastMessage)

      const transactioOptions = {
        toast,
        onBack: () => null,
        onClose,
        onSuccess,
      }

      const txs = position.map((position) =>
        api.tx.omnipool.removeLiquidity(
          position.id,
          position.shares.toFixed(0),
        ),
      )

      if (txs.length > 1) {
        return await createTransaction(
          { tx: api.tx.utility.batch(txs) },
          transactioOptions,
        )
      } else {
        return await createTransaction({ tx: txs[0] }, transactioOptions)
      }
    } else {
      if (!values) return null

      const tOptions = {
        amount: values.tokensToGetShifted,
        symbol: meta.symbol,
        withLrna: values.lrnaToGet.isGreaterThan(0)
          ? t("liquidity.remove.modal.toast.withLrna", {
              lrna: values.lrnaToGet,
            })
          : "",
      }

      const toast = TOAST_MESSAGES.reduce((memo, type) => {
        const msType = type === "onError" ? "onLoading" : type
        memo[type] = (
          <Trans
            t={t}
            i18nKey={`liquidity.remove.modal.toast.${msType}`}
            tOptions={tOptions}
          >
            <span />
            <span className="highlight" />
          </Trans>
        )
        return memo
      }, {} as ToastMessage)

      return await createTransaction(
        {
          tx: api.tx.omnipool.removeLiquidity(
            position.id,
            removeShares.toFixed(0),
          ),
        },
        {
          toast,
          onBack: () => null,
          onClose,
          onSuccess,
          onSubmitted: () => onSubmit(values.tokensToGet.toString()),
        },
      )
    }
  })

  const isFeeExceeded = values?.withdrawalFee?.gte(1)

  return {
    values,
    totalValue,
    removeValue,
    isFeeExceeded,
    meta,
    mutation,
  }
}
