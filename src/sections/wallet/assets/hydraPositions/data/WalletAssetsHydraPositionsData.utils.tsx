import { useOmnipoolPositions } from "api/omnipool"
import { useMemo } from "react"
import { arraySearch, isNotNil } from "utils/helpers"
import { useRpcProvider } from "providers/rpcProvider"
import { TLPData, useLiquidityPositionData } from "utils/omnipool"
import { useAccountsBalances } from "api/accountBalances"
import { useDisplayShareTokenPrice } from "utils/displayAsset"
import { BN_NAN } from "utils/constants"
import { useAcountAssets } from "api/assetDetails"
import { useAccountNFTPositions } from "api/deposits"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useTotalIssuances } from "api/totalIssuance"
import { useShareTokens } from "api/xyk"

export const useOmnipoolPositionsData = ({
  search,
  address,
}: { search?: string; address?: string } = {}) => {
  const accountPositions = useAccountNFTPositions(address)
  const positions = useOmnipoolPositions(
    accountPositions.data?.omnipoolNfts.map((nft) => nft.instanceId) ?? [],
  )

  const positionIds =
    positions
      .map((position) => position.data?.assetId.toString())
      .filter(isNotNil) ?? []

  const { getData } = useLiquidityPositionData(positionIds)

  const isLoading = positions.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (positions.some((q) => !q.data)) return []

    const rows = positions.reduce<TLPData[]>((acc, query) => {
      const position = query.data
      if (!position) return acc

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
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const shareTokens = useShareTokens()
  const accountBalances = useAcountAssets(account?.address)

  const accountShareTokens = accountBalances
    .map((accountBalance) => {
      const shareToken = shareTokens.data?.find(
        (shareToken) => shareToken.shareTokenId === accountBalance.asset.id,
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
    spotPrices.isInitialLoading ||
    shareTokens.isInitialLoading

  const data = useMemo(() => {
    if (!accountShareTokens.length || !totalIssuances || !poolBalances.data)
      return []

    const rows = accountShareTokens.map((myPool) => {
      const totalIssuance = totalIssuances.find(
        (totalIssuance) =>
          totalIssuance.data?.token === myPool.shareToken.shareTokenId,
      )?.data?.total

      const poolBalance = poolBalances.data?.find(
        (poolBalance) =>
          poolBalance.accountId.toString() === myPool.shareToken.poolAddress,
      )
      const balances = myPool.shareToken.assets.map((asset) => {
        const balance =
          asset.id === assets.native.id
            ? poolBalance?.native.freeBalance
            : poolBalance?.balances.find((balance) => balance.id === asset.id)
                ?.freeBalance

        const myShare = myPool.balance.total.div(totalIssuance ?? 1)

        const balanceHuman =
          balance?.shiftedBy(-asset.decimals).multipliedBy(myShare) ?? BN_NAN

        return { amount: balanceHuman, symbol: asset.symbol }
      })

      const spotPrice = spotPrices.data.find(
        (spotPrice) => spotPrice.tokenIn === myPool.shareToken.shareTokenId,
      )

      const amount =
        totalIssuance
          ?.times(myPool.balance.total.div(totalIssuance ?? 1))
          .shiftedBy(-myPool.shareToken.meta.decimals) ?? BN_NAN

      const valueDisplay = amount.multipliedBy(spotPrice?.spotPrice ?? 1)

      return {
        amount,
        valueDisplay,
        value: BN_NAN,
        id: myPool.shareToken.meta.id,
        assetId: myPool.shareToken.meta.id,
        name: myPool.shareToken.meta.name,
        symbol: myPool.shareToken.meta.symbol,
        balances,
        isXykPosition: true,
      }
    })

    return search ? arraySearch(rows, search, ["symbol", "name"]) : rows
  }, [
    accountShareTokens,
    assets,
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
