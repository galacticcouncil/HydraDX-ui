import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { ApiPromise } from "@polkadot/api"
import { BN_NAN, MIN_WITHDRAWAL_FEE } from "utils/constants"
import { useRpcProvider } from "providers/rpcProvider"
import { scaleHuman } from "utils/balance"
import { safeConvertAddressSS58 } from "utils/formatting"
import {
  getEvmAddress,
  H160,
  isEvmAddress,
  safeConvertAddressH160,
} from "utils/evm"
import { useTokenBalance } from "./balances"
import { useAssets } from "providers/assets"
import { Permill } from "@polkadot/types/interfaces"

export const useMinWithdrawalFee = () => {
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.minWithdrawalFee, getMinWithdrawalFee(api))
}

const getMinWithdrawalFee = (api: ApiPromise) => async () => {
  const minWithdrawalFee = await api.consts.omnipool.minWithdrawalFee

  return minWithdrawalFee?.toBigNumber().div(1000000) ?? MIN_WITHDRAWAL_FEE
}

export const useMaxAddLiquidityLimit = () => {
  const { api } = useRpcProvider()

  return useQuery(QUERY_KEYS.maxAddLiquidityLimit, getMaxAddLiquidityLimit(api))
}

const getMaxAddLiquidityLimit = (api: ApiPromise) => async () => {
  const data =
    await api.consts.circuitBreaker.defaultMaxAddLiquidityLimitPerBlock

  const [n, d] = data.unwrap()
  const minWithdrawalFee = n.toBigNumber().div(d.toNumber())

  return minWithdrawalFee
}

export const useInsufficientFee = (assetId: string, address: string) => {
  const { api } = useRpcProvider()
  const { native, getAssetWithFallback } = useAssets()
  const { isSufficient } = getAssetWithFallback(assetId)

  const isValidAddress =
    safeConvertAddressSS58(address, 0) != null ||
    safeConvertAddressH160(address) !== null

  const isEvm = isEvmAddress(address)

  const validAddress = isEvm
    ? new H160(getEvmAddress(address)).toAccount()
    : address

  const balance = useTokenBalance(
    assetId,
    isValidAddress && !isSufficient ? validAddress : undefined,
  ).data?.balance

  const fee = useQuery(
    QUERY_KEYS.insufficientFee,
    async () => {
      const fee = await api.consts.balances.existentialDeposit

      return fee.toBigNumber().times(1.1)
    },
    {
      enabled: !isSufficient,
      cacheTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 1,
    },
  ).data

  if (isSufficient) return undefined

  if (!balance || balance.gt(0)) return undefined

  return fee
    ? {
        value: fee,
        displayValue: scaleHuman(fee, native.decimals),
        symbol: native.symbol,
      }
    : undefined
}

export const useOTCfee = () => {
  const { api, isLoaded } = useRpcProvider()

  return useQuery(
    QUERY_KEYS.otcFee,
    async () => {
      const fee = (await api.consts.otc.fee) as Permill

      if (!fee) return BN_NAN

      return fee.toBigNumber().div(1000000)
    },
    {
      enabled: isLoaded,
      retry: 0,
      cacheTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 1,
    },
  )
}
