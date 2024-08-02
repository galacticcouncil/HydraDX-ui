import { useAccountBalances } from "api/accountBalances"
import { useTokenLocks } from "api/balances"
import { useMemo } from "react"
import { NATIVE_ASSET_ID } from "utils/api"
import { BLOCK_TIME, BN_0, BN_NAN } from "utils/constants"
import { arraySearch, sortAssets } from "utils/helpers"
import { useDisplayPrice, useDisplayPrices } from "utils/displayAsset"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAcceptedCurrencies, useAccountCurrency } from "api/payments"
import { useAccountVotes } from "api/democracy"
import { durationInDaysAndHoursFromNow } from "utils/formatting"
import { ToastMessage, useStore } from "state/store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useExternalTokenMeta } from "sections/wallet/addToken/AddToken.utils"
import { useAssets } from "providers/assets"

export const useAssetsData = ({
  isAllAssets,
  search,
  address: givenAddress,
}: {
  isAllAssets?: boolean
  search?: string
  address?: string
} = {}) => {
  const { account } = useAccount()
  const {
    tradable,
    stableswap,
    external,
    getAsset,
    tokens,
    native,
    getAssetWithFallback,
  } = useAssets()
  const address = givenAddress ?? account?.address

  const balances = useAccountBalances(address, true)
  const getExternalMeta = useExternalTokenMeta()
  const nativeTokenWithBalance = balances.data?.native
  const tokensWithBalance = useMemo(() => {
    if (nativeTokenWithBalance && balances.data) {
      const filteredTokens = balances.data.balances.filter((balance) => {
        if (balance.id === native.id) return false

        const meta = getAsset(balance.id)

        return meta?.isToken || meta?.isStableSwap || meta?.isExternal
      })

      return nativeTokenWithBalance.total.gt(0)
        ? [...filteredTokens, nativeTokenWithBalance]
        : filteredTokens
    }

    return []
  }, [balances.data, getAsset, nativeTokenWithBalance, native])

  const tokensWithBalanceIds = tokensWithBalance.map(
    (tokenWithBalance) => tokenWithBalance.id,
  )

  const currencyId = useAccountCurrency(address).data
  const acceptedCurrencies = useAcceptedCurrencies(tokensWithBalanceIds)

  const spotPrices = useDisplayPrices(tokensWithBalanceIds)

  const allAssets = useMemo(
    () => [...tokens, ...stableswap, ...external],
    [external, stableswap, tokens],
  )

  const data = useMemo(() => {
    if (!tokensWithBalance.length || !spotPrices.data) return []
    const rowsWithBalance = tokensWithBalance.map((balance) => {
      const asset = getAssetWithFallback(balance.id)
      const isExternalInvalid = asset.isExternal && !asset.symbol
      const meta = isExternalInvalid
        ? getExternalMeta(asset.id) ?? asset
        : asset

      const { decimals, id, name, symbol } = meta
      const inTradeRouter = tradable.some((tradeAsset) => tradeAsset.id === id)
      const spotPrice =
        spotPrices.data?.find((spotPrice) => spotPrice?.tokenIn === id)
          ?.spotPrice ?? BN_NAN

      const reserved = balance.reservedBalance.shiftedBy(-decimals)
      const reservedDisplay = reserved.times(spotPrice)

      const total = balance.total.shiftedBy(-decimals)
      const totalDisplay = total.times(spotPrice)

      const transferable = balance.balance.shiftedBy(-decimals)
      const transferableDisplay = transferable.times(spotPrice)

      const isAcceptedCurrency = !!acceptedCurrencies.data?.find(
        (acceptedCurrencie) => acceptedCurrencie.id === id,
      )?.accepted

      const isPaymentFee = currencyId === id
      const couldBeSetAsPaymentFee = isAcceptedCurrency && !isPaymentFee

      const tradability = {
        canBuy: inTradeRouter,
        canSell: inTradeRouter,
        inTradeRouter,
      }

      return {
        id,
        symbol,
        name,
        meta,
        isPaymentFee,
        couldBeSetAsPaymentFee,
        reserved,
        reservedDisplay,
        total,
        totalDisplay,
        transferable,
        transferableDisplay,
        tradability,
        isExternalInvalid,
      }
    })

    const rows = isAllAssets
      ? allAssets.reduce<typeof rowsWithBalance>((acc, meta) => {
          const { id, symbol, name, isExternal } = meta
          const tokenWithBalance = rowsWithBalance.find((row) => row.id === id)

          if (tokenWithBalance) {
            acc.push(tokenWithBalance)
          } else {
            const inTradeRouter = tradable.some(
              (tradeAsset) => tradeAsset.id === id,
            )

            const tradability = {
              canBuy: inTradeRouter,
              canSell: inTradeRouter,
              inTradeRouter,
            }

            const isExternalInvalid = isExternal && !symbol

            const asset = {
              id,
              symbol,
              name,
              meta,
              isPaymentFee: false,
              couldBeSetAsPaymentFee: false,
              reserved: BN_0,
              reservedDisplay: BN_0,
              total: BN_0,
              totalDisplay: BN_0,
              transferable: BN_0,
              transferableDisplay: BN_0,
              tradability,
              isExternalInvalid,
            }

            acc.push(asset)
          }
          return acc
        }, [])
      : rowsWithBalance

    const sortedAssets = sortAssets(
      rows,
      "transferableDisplay",
      NATIVE_ASSET_ID,
    )

    return search
      ? arraySearch(sortedAssets, search, ["symbol", "name"])
      : sortedAssets
  }, [
    tokensWithBalance,
    spotPrices.data,
    isAllAssets,
    allAssets,
    search,
    getAssetWithFallback,
    getExternalMeta,
    tradable,
    acceptedCurrencies.data,
    currencyId,
  ])

  return { data, isLoading: balances.isLoading || spotPrices.isInitialLoading }
}

export type AssetsTableData = ReturnType<typeof useAssetsData>["data"][number]

export const useLockedNativeTokens = () => {
  const {
    native: { decimals, id },
  } = useAssets()
  const locks = useTokenLocks(id)
  const spotPrice = useDisplayPrice(id)

  const lockVesting =
    locks.data
      ?.find((lock) => lock.type === "ormlvest")
      ?.amount.shiftedBy(-decimals) ?? BN_0
  const lockDemocracy =
    locks.data
      ?.find((lock) => lock.type === "democrac")
      ?.amount.shiftedBy(-decimals) ?? BN_0
  const lockStaking =
    locks.data
      ?.find((lock) => lock.type === "stk_stks")
      ?.amount.shiftedBy(-decimals) ?? BN_0

  const lockVestingDisplay = lockVesting.times(spotPrice.data?.spotPrice ?? 1)
  const lockDemocracyDisplay = lockDemocracy.times(
    spotPrice.data?.spotPrice ?? 1,
  )
  const lockStakingDisplay = lockStaking.times(spotPrice.data?.spotPrice ?? 1)

  return {
    isLoading: locks.isLoading || spotPrice.isLoading,
    lockVesting,
    lockDemocracy,
    lockStaking,
    lockVestingDisplay,
    lockDemocracyDisplay,
    lockStakingDisplay,
  }
}

export const useUnlockableTokens = () => {
  const { native } = useAssets()
  const locks = useTokenLocks(native.id)
  const votes = useAccountVotes()
  const spotPrice = useDisplayPrice(native.id)

  const lockDemocracy =
    locks.data?.find((lock) => lock.type === "democrac")?.amount ?? BN_0

  const value = lockDemocracy.isZero()
    ? BN_0
    : lockDemocracy
        .minus(votes.data?.maxLockedValue ?? 0)
        .shiftedBy(-native.decimals)
  const date = votes.data?.maxLockedBlock.times(BLOCK_TIME)
  const endDate =
    votes.data && !votes.data.maxLockedBlock.isZero()
      ? durationInDaysAndHoursFromNow(date?.times(1000).toNumber() ?? 0)
      : undefined

  return {
    isLoading: votes.isInitialLoading || spotPrice.isLoading || locks.isLoading,
    ids: votes.data?.ids ?? [],
    value,
    displayValue: value?.times(spotPrice.data?.spotPrice ?? 1),
    votesUnlocked: votes.data?.ids.length,
    endDate,
  }
}

export const useUnlockTokens = ({
  ids,
  toast,
}: {
  ids: string[]
  toast: ToastMessage
}) => {
  const { api } = useRpcProvider()
  const { account } = useAccount()
  const { native } = useAssets()
  const { createTransaction } = useStore()
  const queryClient = useQueryClient()

  return useMutation(async () => {
    const txs = ids.map((id) => api.tx.democracy.removeVote(id))

    if (!txs.length) return null

    return await createTransaction(
      {
        tx: api.tx.utility.batchAll([
          ...txs,
          ...(account?.address
            ? [api.tx.democracy.unlock(account.address)]
            : []),
        ]),
      },
      {
        toast,
        onSuccess: () => {
          queryClient.invalidateQueries(
            QUERY_KEYS.lock(account?.address, native.id),
          )
        },
      },
    )
  })
}
