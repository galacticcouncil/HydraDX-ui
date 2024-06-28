import { useAccountBalances } from "api/accountBalances"
import { useTokenLocks } from "api/balances"
import { useMemo } from "react"
import { NATIVE_ASSET_ID } from "utils/api"
import { BLOCK_TIME, BN_0, BN_NAN } from "utils/constants"
import { arraySearch } from "utils/helpers"
import { useDisplayPrice, useDisplayPrices } from "utils/displayAsset"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAcceptedCurrencies, useAccountCurrency } from "api/payments"
import { useAccountVotes } from "api/democracy"
import { durationInDaysAndHoursFromNow } from "utils/formatting"
import { ToastMessage, useStore } from "state/store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"

export const useAssetsData = ({
  isAllAssets,
  search,
  address: givenAddress,
}: {
  isAllAssets?: boolean
  search?: string
  address?: string
} = {}) => {
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const address = givenAddress ?? account?.address

  const balances = useAccountBalances(address, true)
  const nativeTokenWithBalance = balances.data?.native
  const tokensWithBalance = useMemo(() => {
    if (nativeTokenWithBalance && balances.data) {
      const filteredTokens = balances.data.balances.filter((balance) => {
        const meta = assets.getAsset(balance.id)

        return (
          (meta.isToken || meta.isStableSwap || meta.isExternal) &&
          !meta.isNative
        )
      })

      return nativeTokenWithBalance.total.gt(0)
        ? [...filteredTokens, nativeTokenWithBalance]
        : filteredTokens
    }

    return []
  }, [assets, balances.data, nativeTokenWithBalance])

  const tokensWithBalanceIds = tokensWithBalance.map(
    (tokenWithBalance) => tokenWithBalance.id,
  )

  const currencyId = useAccountCurrency(address).data
  const acceptedCurrencies = useAcceptedCurrencies(tokensWithBalanceIds)

  const spotPrices = useDisplayPrices(tokensWithBalanceIds)

  const allAssets = useMemo(
    () => [...assets.tokens, ...assets.stableswap, ...assets.external],
    [assets.external, assets.stableswap, assets.tokens],
  )

  const data = useMemo(() => {
    if (!tokensWithBalance.length || !spotPrices.data) return []
    const rowsWithBalance = tokensWithBalance.map((balance) => {
      let { decimals, id, name, symbol, isExternal } = assets.getAsset(
        balance.id,
      )

      const inTradeRouter = assets.tradeAssets.some(
        (tradeAsset) => tradeAsset.id === id,
      )
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
        decimals,
        isPaymentFee,
        couldBeSetAsPaymentFee,
        reserved,
        reservedDisplay,
        total,
        totalDisplay,
        transferable,
        transferableDisplay,
        tradability,
        isExternal,
      }
    })

    const result = isAllAssets
      ? allAssets.reduce<typeof rowsWithBalance>(
          (
            acc,
            { id, symbol, name, decimals, isExternal, externalId, parachainId },
          ) => {
            const tokenWithBalance = rowsWithBalance.find(
              (row) => row.id === id,
            )

            if (tokenWithBalance) {
              acc.push(tokenWithBalance)
            } else {
              const inTradeRouter = assets.tradeAssets.some(
                (tradeAsset) => tradeAsset.id === id,
              )

              const tradability = {
                canBuy: inTradeRouter,
                canSell: inTradeRouter,
                inTradeRouter,
              }

              const asset = {
                id,
                symbol,
                name,
                decimals,
                isPaymentFee: false,
                couldBeSetAsPaymentFee: false,
                reserved: BN_0,
                reservedDisplay: BN_0,
                total: BN_0,
                totalDisplay: BN_0,
                transferable: BN_0,
                transferableDisplay: BN_0,
                tradability,
                isExternal,
              }

              if (asset.symbol) {
                acc.push(asset)
              }
            }
            return acc
          },
          [],
        )
      : rowsWithBalance

    result.sort((a, b) => {
      // native asset first
      if (a.id === NATIVE_ASSET_ID) return -1
      if (b.id === NATIVE_ASSET_ID) return 1

      if (a.transferableDisplay.isNaN()) return 1
      if (b.transferableDisplay.isNaN()) return -1

      if (a.isExternal && !a.symbol) return 1
      if (b.isExternal && !b.symbol) return -1

      if (!b.transferableDisplay.eq(a.transferableDisplay))
        return b.transferableDisplay.minus(a.transferableDisplay).toNumber()

      return a.symbol.localeCompare(b.symbol)
    })

    return search ? arraySearch(result, search, ["symbol", "name"]) : result
  }, [
    acceptedCurrencies.data,
    assets,
    currencyId,
    spotPrices.data,
    tokensWithBalance,
    search,
    isAllAssets,
    allAssets,
  ])

  return { data, isLoading: balances.isLoading || spotPrices.isInitialLoading }
}

export type AssetsTableData = ReturnType<typeof useAssetsData>["data"][number]

export const useLockedValues = (id: string) => {
  const { assets } = useRpcProvider()
  const isNativeToken = id === assets.native.id

  const locks = useTokenLocks(isNativeToken ? assets.native.id : undefined)
  const spotPrice = useDisplayPrice(
    isNativeToken ? assets.native.id : undefined,
  )

  const data = useMemo(() => {
    if (locks.data && spotPrice.data) {
      const { decimals } = assets.native
      const spotPriceData = spotPrice.data.spotPrice

      const lockVesting = locks.data.find(
        (lock) => lock.id === id.toString() && lock.type === "ormlvest",
      )
      const lockedVesting = lockVesting?.amount.shiftedBy(-decimals) ?? BN_0
      const lockedVestingDisplay = lockedVesting.times(spotPriceData)

      const lockDemocracy = locks.data.find(
        (lock) => lock.id === id.toString() && lock.type === "democrac",
      )
      const lockedDemocracy = lockDemocracy?.amount.shiftedBy(-decimals) ?? BN_0
      const lockedDemocracyDisplay = lockedDemocracy.times(spotPriceData)

      const lockStaking = locks.data.find(
        (lock) => lock.id === id.toString() && lock.type === "stk_stks",
      )
      const lockedStaking = lockStaking?.amount.shiftedBy(-decimals) ?? BN_0
      const lockedStakingDisplay = lockedStaking.times(spotPriceData)

      return {
        lockedVesting,
        lockedVestingDisplay,
        lockedDemocracy,
        lockedDemocracyDisplay,
        lockedStaking,
        lockedStakingDisplay,
      }
    }
  }, [assets.native, id, locks.data, spotPrice.data])

  return {
    data,
    isLoading: locks.isInitialLoading || spotPrice.isInitialLoading,
  }
}

export const useLockedNativeTokens = () => {
  const {
    assets: {
      native: { id, decimals },
    },
  } = useRpcProvider()
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
  const {
    assets: { native },
  } = useRpcProvider()
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
  const { api, assets } = useRpcProvider()
  const { account } = useAccount()
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
            QUERY_KEYS.lock(account?.address, assets.native.id),
          )
        },
      },
    )
  })
}
