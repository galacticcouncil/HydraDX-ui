import { useMemo } from "react"
import { arraySearch, isNotNil } from "utils/helpers"
import { TLPData, useLiquidityPositionData } from "utils/omnipool"
import { useAccountsBalances } from "api/accountBalances"
import { useDisplayShareTokenPrice } from "utils/displayAsset"
import { BN_NAN } from "utils/constants"
import { useAssets } from "providers/assets"
import { useAccountPositions } from "api/deposits"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useTotalIssuances } from "api/totalIssuance"
import { useAcountAssets } from "api/assetDetails"

export const useOmnipoolPositionsData = ({
  search,
  address,
}: { search?: string; address?: string } = {}) => {
  const accountPositionsQuery = useAccountPositions(address)
  const positions = useMemo(
    () => accountPositionsQuery.data?.liquidityPositions ?? [],
    [accountPositionsQuery.data?.liquidityPositions],
  )

  const positionIds = positions.map((position) => position.assetId)

  const { getData } = useLiquidityPositionData(positionIds)

  const isLoading = accountPositionsQuery.isInitialLoading

  const data = useMemo(() => {
    const rows = positions.reduce<TLPData[]>((acc, position) => {
      const data = getData(position)
      if (data) acc.push(data)
      return acc
    }, [])

    return search ? arraySearch(rows, search, ["symbol", "name"]) : rows
  }, [getData, positions, search])

  return {
    data,
    isLoading,
    isInitialLoading: isLoading,
  }
}

export const useXykPositionsData = ({ search }: { search?: string } = {}) => {
  const { native, shareTokens } = useAssets()
  const { account } = useAccount()
  const accountBalances = useAcountAssets(account?.address)

  const accountShareTokens = accountBalances
    .map((accountBalance) => {
      const shareToken = shareTokens.find(
        (shareToken) => shareToken.id === accountBalance.asset.id,
      )

      if (shareToken) return { ...accountBalance, shareToken }
      return undefined
    })
    .filter(isNotNil)

  const shareTokensId = accountShareTokens.map((pool) => pool.asset.id)
  const shareTokensAddresses = accountShareTokens.map(
    (pool) => pool.shareToken.poolAddress,
  )

  const totalIssuances = useTotalIssuances(shareTokensId)
  const poolBalances = useAccountsBalances(shareTokensAddresses)
  const spotPrices = useDisplayShareTokenPrice(shareTokensId)

  const isLoading =
    totalIssuances.some((totalIssuance) => totalIssuance.isInitialLoading) ||
    poolBalances.isInitialLoading ||
    spotPrices.isInitialLoading

  const data = useMemo(() => {
    if (!accountShareTokens.length || !totalIssuances || !poolBalances.data)
      return []

    const rows = accountShareTokens.map((myPool) => {
      const totalIssuance = totalIssuances.find(
        (totalIssuance) => totalIssuance.data?.token === myPool.shareToken.id,
      )?.data?.total

      const poolBalance = poolBalances.data?.find(
        (poolBalance) =>
          poolBalance.accountId.toString() === myPool.shareToken.poolAddress,
      )
      const balances = myPool.shareToken.assets.map((asset) => {
        const balance =
          asset.id === native.id
            ? poolBalance?.native.freeBalance
            : poolBalance?.balances.find((balance) => balance.id === asset.id)
                ?.freeBalance

        const myShare = myPool.balance.total.div(totalIssuance ?? 1)

        const balanceHuman =
          balance?.shiftedBy(-asset.decimals).multipliedBy(myShare) ?? BN_NAN

        return { amount: balanceHuman, symbol: asset.symbol }
      })

      const spotPrice = spotPrices.data.find(
        (spotPrice) => spotPrice.tokenIn === myPool.shareToken.id,
      )

      const amount =
        totalIssuance
          ?.times(myPool.balance.total.div(totalIssuance ?? 1))
          .shiftedBy(-myPool.shareToken.decimals) ?? BN_NAN

      const valueDisplay = amount.multipliedBy(spotPrice?.spotPrice ?? 1)

      return {
        amount,
        valueDisplay,
        value: BN_NAN,
        id: myPool.shareToken.id,
        assetId: myPool.shareToken.id,
        name: myPool.shareToken.name,
        symbol: myPool.shareToken.symbol,
        balances,
        isXykPosition: true,
      }
    })

    return search ? arraySearch(rows, search, ["symbol", "name"]) : rows
  }, [
    accountShareTokens,
    native.id,
    poolBalances.data,
    search,
    spotPrices.data,
    totalIssuances,
  ])

  return { data, isLoading }
}

export type TXYKPosition = NonNullable<
  ReturnType<typeof useXykPositionsData>["data"]
>[number]

export const isXYKPosition = (
  position: TLPData | TXYKPosition,
): position is TXYKPosition => (position as TXYKPosition).isXykPosition
