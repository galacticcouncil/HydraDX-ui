import {
  API_ETH_MOCK_ADDRESS,
  ReservesDataHumanized,
} from "@aave/contract-helpers"
import { USD_DECIMALS, nativeToUSD, normalize } from "@aave/math-utils"
import { BigNumber } from "bignumber.js"
import { UserPoolTokensBalances } from "sections/lending/services/WalletBalanceService"
import { useRootStore } from "sections/lending/store/root"
import {
  MarketDataType,
  networkConfigs,
} from "sections/lending/utils/marketsAndNetworksConfig"

import { useMemo, useState } from "react"
import { useDeepCompareEffect } from "react-use"
import { usePoolsReservesHumanized } from "sections/lending/hooks/pool/usePoolReserves"
import { usePoolsTokensBalance } from "sections/lending/hooks/pool/usePoolTokensBalance"

export interface WalletBalance {
  address: string
  amount: string
}

type FormatAggregatedBalanceParams = {
  reservesHumanized?: ReservesDataHumanized
  balances?: UserPoolTokensBalances[]
  marketData: MarketDataType
}

const formatAggregatedBalance = ({
  reservesHumanized,
  balances,
  marketData,
}: FormatAggregatedBalanceParams) => {
  const reserves = reservesHumanized?.reservesData || []
  const baseCurrencyData = reservesHumanized?.baseCurrencyData || {
    marketReferenceCurrencyDecimals: 0,
    marketReferenceCurrencyPriceInUsd: "0",
    networkBaseTokenPriceInUsd: "0",
    networkBaseTokenPriceDecimals: 0,
  }

  const walletBalances = balances ?? []
  // process data
  let hasEmptyWallet = true
  const aggregatedBalance = walletBalances.reduce(
    (acc, reserve) => {
      const poolReserve = reserves.find((poolReserve) => {
        if (reserve.address === API_ETH_MOCK_ADDRESS.toLowerCase()) {
          return (
            poolReserve.symbol.toLowerCase() ===
            networkConfigs[
              marketData.chainId
            ].wrappedBaseAssetSymbol?.toLowerCase()
          )
        }
        return poolReserve.underlyingAsset.toLowerCase() === reserve.address
      })
      if (reserve.amount !== "0") hasEmptyWallet = false
      if (poolReserve) {
        acc[reserve.address] = {
          amount: normalize(reserve.amount, poolReserve.decimals),
          amountUSD: nativeToUSD({
            amount: new BigNumber(reserve.amount),
            currencyDecimals: poolReserve.decimals,
            priceInMarketReferenceCurrency:
              poolReserve.priceInMarketReferenceCurrency,
            marketReferenceCurrencyDecimals:
              baseCurrencyData.marketReferenceCurrencyDecimals,
            normalizedMarketReferencePriceInUsd: normalize(
              baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              USD_DECIMALS,
            ),
          }),
        }
      }
      return acc
    },
    {} as { [address: string]: { amount: string; amountUSD: string } },
  )
  return {
    walletBalances: aggregatedBalance,
    hasEmptyWallet,
  }
}

export const usePoolsWalletBalances = (marketDatas: MarketDataType[]) => {
  const user = useRootStore((store) => store.account)
  const tokensBalanceQueries = usePoolsTokensBalance(marketDatas, user)
  const poolsBalancesQueries = usePoolsReservesHumanized(marketDatas)

  const isLoading =
    tokensBalanceQueries.find((elem) => elem.isInitialLoading) ||
    poolsBalancesQueries.find((elem) => elem.isInitialLoading)

  const walletBalances = useMemo(() => {
    if (isLoading) return []
    const walletBalances = poolsBalancesQueries.map((query, index) =>
      formatAggregatedBalance({
        reservesHumanized: query.data,
        balances: tokensBalanceQueries[index]?.data,
        marketData: marketDatas[index],
      }),
    )
    return walletBalances
  }, [isLoading, marketDatas, poolsBalancesQueries, tokensBalanceQueries])

  return {
    isLoading,
    walletBalances,
  }
}

export const useWalletBalances = (marketData: MarketDataType) => {
  const { walletBalances, isLoading } = usePoolsWalletBalances([marketData])
  const [balances, setBalances] = useState<
    Record<
      string,
      {
        amount: string
        amountUSD: string
      }
    >
  >({})
  const [loading, setLoading] = useState(true)
  const [hasEmptyWallet, setHasEmptyWallet] = useState(true)

  useDeepCompareEffect(() => {
    setBalances(walletBalances[0]?.walletBalances ?? {})
    setLoading(!!isLoading)
    setHasEmptyWallet(walletBalances[0]?.hasEmptyWallet)
  }, [walletBalances[0]?.walletBalances, { isLoading }])

  return {
    walletBalances: balances,
    hasEmptyWallet,
    loading,
  }
}
