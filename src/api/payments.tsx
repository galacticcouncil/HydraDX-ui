import BigNumber from "bignumber.js"
import { ApiPromise } from "@polkadot/api"
import { SubmittableExtrinsic } from "@polkadot/api/promise/types"
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { Maybe, undefinedNoop, normalizeId } from "utils/helpers"
import { NATIVE_ASSET_ID } from "utils/api"
import { ToastMessage, useStore } from "state/store"
import { u32 } from "@polkadot/types-codec"
import { AccountId32 } from "@open-web3/orml-types/interfaces"
import { usePaymentInfo } from "./transaction"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useSpotPrice } from "./spotPrice"
import { useOraclePrice } from "./farms"
import { BN_1, BN_NAN } from "utils/constants"
import { TOAST_MESSAGES } from "state/toasts"
import { Trans, useTranslation } from "react-i18next"

export const getAcceptedCurrency =
  (api: ApiPromise, id: u32 | string) => async () => {
    const normalizedId = normalizeId(id)
    const result =
      await api.query.multiTransactionPayment.acceptedCurrencies(normalizedId)

    return {
      id: normalizedId,
      accepted: normalizedId === NATIVE_ASSET_ID || !result.isEmpty,
      data: result.unwrapOr(null)?.toBigNumber(),
    }
  }

export const useAcceptedCurrencies = (ids: Maybe<string | u32>[]) => {
  const { api } = useRpcProvider()

  return useQueries({
    queries: ids.map((id) => ({
      queryKey: QUERY_KEYS.acceptedCurrencies(id),
      queryFn: !!id ? getAcceptedCurrency(api, id) : undefinedNoop,
      enabled: !!id,
    })),
  })
}

export const useSetAsFeePayment = (tx?: SubmittableExtrinsic) => {
  const { t } = useTranslation()
  const { api, assets } = useRpcProvider()
  const { account } = useAccount()
  const { createTransaction, cancelTransaction, transactions } = useStore()
  const queryClient = useQueryClient()

  return async (tokenId: string) => {
    if (!tokenId) return

    const isSetCurrency = tx?.method.method === "setCurrency"

    if (isSetCurrency) {
      const currenctTransaction = transactions?.[0]

      if (currenctTransaction) {
        cancelTransaction(currenctTransaction.id)
      }
    }

    const { symbol } = assets.getAsset(tokenId)

    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`wallet.assets.table.actions.payment.toast.${msType}`}
          tOptions={{
            asset: symbol,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    const transaction = await createTransaction(
      {
        tx: api.tx.multiTransactionPayment.setCurrency(tokenId),
        overrides: {
          currencyId: tokenId,
        },
      },
      { toast, onBack: () => {} },
    )

    if (transaction.isError) return
    await queryClient.refetchQueries({
      queryKey: QUERY_KEYS.accountCurrency(account?.address),
    })
  }
}

export const getAccountCurrency =
  (api: ApiPromise, address: string | AccountId32) => async () => {
    const result =
      await api.query.multiTransactionPayment.accountCurrencyMap(address)

    if (!result.isEmpty) {
      return result.toString()
    }

    return NATIVE_ASSET_ID
  }

export const useAccountCurrency = (address: Maybe<string | AccountId32>) => {
  const { api, isLoaded } = useRpcProvider()
  return useQuery(
    QUERY_KEYS.accountCurrency(address),
    !!address ? getAccountCurrency(api, address) : undefinedNoop,
    {
      enabled: !!address && isLoaded,
    },
  )
}

export const useTransactionFeeInfo = (
  extrinsic: SubmittableExtrinsic,
  customFeeId?: string,
) => {
  const { assets } = useRpcProvider()
  const { account } = useAccount()

  const accountCurrency = useAccountCurrency(account?.address)
  const paymentInfo = usePaymentInfo(extrinsic)

  const currencyMeta = customFeeId
    ? assets.getAsset(customFeeId)
    : accountCurrency.data
    ? assets.getAsset(accountCurrency.data)
    : undefined

  const oraclePrice = useOraclePrice("1", currencyMeta?.id)
  const isOraclePriceNone = oraclePrice.data?.isNone

  const currency = useAcceptedCurrencies([
    isOraclePriceNone ? currencyMeta?.id : undefined,
  ])

  const assetCurrency = currency?.[0].data?.data

  const spotPriceQuery = useSpotPrice(assets.native.id, currencyMeta?.id)

  let spotPrice: BigNumber

  if (assetCurrency) {
    spotPrice = BN_1.shiftedBy(assets.native.decimals)
      .times(assetCurrency.toString())
      .shiftedBy(-18)
      .shiftedBy(-(currencyMeta?.decimals ?? 0))
  } else {
    spotPrice = spotPriceQuery.data?.spotPrice ?? BN_1
  }

  const nativeFee = paymentInfo.data?.partialFee.toBigNumber()

  const fee = nativeFee
    ? nativeFee.shiftedBy(-assets.native.decimals).times(spotPrice)
    : undefined

  return {
    isLoading:
      accountCurrency.isInitialLoading ||
      paymentInfo.isInitialLoading ||
      spotPriceQuery.isInitialLoading,
    fee,
    feeSymbol: currencyMeta?.symbol,
    nativeFee: nativeFee ?? BN_NAN,
  }
}
