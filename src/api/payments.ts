import BigNumber from "bignumber.js"
import { ApiPromise } from "@polkadot/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { Maybe, isNotNil, identity, undefinedNoop } from "utils/helpers"
import { NATIVE_ASSET_ID } from "utils/api"
import { ToastMessage, useStore } from "state/store"
import { AccountId32 } from "@open-web3/orml-types/interfaces"
import { usePaymentInfo } from "./transaction"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAssets } from "providers/assets"
import { useMemo } from "react"
import { uniqBy } from "utils/rx"
import { NATIVE_EVM_ASSET_ID, isEvmAccount } from "utils/evm"
import { useAcountAssets } from "./assetDetails"

export const getAcceptedCurrency = (api: ApiPromise) => async () => {
  const dataRaw =
    await api.query.multiTransactionPayment.acceptedCurrencies.entries()

  const data = dataRaw.map(([key, data]) => {
    return {
      id: key.args[0].toString(),
      accepted: !data.isEmpty,
      data: data.unwrapOr(null)?.toBigNumber(),
    }
  })

  return data
}

export const useAcceptedCurrencies = (ids: string[]) => {
  const { api, isLoaded } = useRpcProvider()
  const { native } = useAssets()

  return useQuery(QUERY_KEYS.acceptedCurrencies, getAcceptedCurrency(api), {
    enabled: isLoaded,
    select: (assets) => {
      return ids.map((id) => {
        const response = assets.find((asset) => asset.id === id)

        return response
          ? response
          : id === native.id
            ? { id, accepted: true, data: undefined }
            : { id, accepted: false, data: undefined }
      })
    },
  })
}

export const useSetAsFeePayment = () => {
  const { api } = useRpcProvider()
  const { native } = useAssets()
  const { account } = useAccount()
  const { createTransaction } = useStore()
  const queryClient = useQueryClient()
  const { data: paymentInfoData } = usePaymentInfo(
    api.tx.currencies.transfer("", native.id, "0"),
  )

  return async (tokenId?: string, toast?: ToastMessage) => {
    if (!(tokenId && paymentInfoData)) return

    const transaction = await createTransaction(
      {
        tx: api.tx.multiTransactionPayment.setCurrency(tokenId),
        overrides: {
          fee: new BigNumber(paymentInfoData.partialFee.toHex()),
          currencyId: tokenId,
        },
      },
      { toast },
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

export const useAccountFeePaymentAssets = () => {
  const { featureFlags } = useRpcProvider()
  const { account } = useAccount()
  const { getAsset } = useAssets()
  const accountAssets = useAcountAssets(account?.address)
  const accountFeePaymentAsset = useAccountCurrency(account?.address)
  const feePaymentAssetId = accountFeePaymentAsset.data

  const allowedFeePaymentAssetsIds = useMemo(() => {
    if (isEvmAccount(account?.address) && !featureFlags.dispatchPermit) {
      const evmNativeAssetId = getAsset(NATIVE_EVM_ASSET_ID)?.id
      return uniqBy(
        identity,
        [evmNativeAssetId, feePaymentAssetId].filter(isNotNil),
      )
    }

    const assetIds = accountAssets.map((accountAsset) => accountAsset.asset.id)
    return uniqBy(identity, [...assetIds, feePaymentAssetId].filter(isNotNil))
  }, [
    account?.address,
    featureFlags.dispatchPermit,
    accountAssets,
    feePaymentAssetId,
    getAsset,
  ])

  const acceptedFeePaymentAssets = useAcceptedCurrencies(
    allowedFeePaymentAssetsIds,
  )

  const data = acceptedFeePaymentAssets?.data ?? []

  const acceptedFeePaymentAssetsIds = data
    .filter((acceptedFeeAsset) => acceptedFeeAsset?.accepted)
    .map((acceptedFeeAsset) => acceptedFeeAsset?.id)

  const isLoading =
    accountFeePaymentAsset.isLoading || acceptedFeePaymentAssets.isLoading
  const isInitialLoading =
    accountFeePaymentAsset.isInitialLoading ||
    acceptedFeePaymentAssets.isInitialLoading
  const isSuccess =
    accountFeePaymentAsset.isSuccess && acceptedFeePaymentAssets.isSuccess

  return {
    acceptedFeePaymentAssetsIds,
    acceptedFeePaymentAssets,
    feePaymentAssetId,
    isLoading,
    isInitialLoading,
    isSuccess,
  }
}
