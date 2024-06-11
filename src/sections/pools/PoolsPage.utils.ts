import {
  useShareTokenBalances,
  useTokenBalance,
  useTokensBalances,
} from "api/balances"
import { useHubAssetTradability, useOmnipoolAssets } from "api/omnipool"
import { useMemo } from "react"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { NATIVE_ASSET_ID, OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { normalizeBigNumber } from "utils/balance"
import { BN_0, BN_1, BN_MILL, BN_NAN } from "utils/constants"
import {
  useDisplayAssetStore,
  useDisplayPrices,
  useDisplayShareTokenPrice,
} from "utils/displayAsset"
import { useStableswapPool, useStableswapPools } from "api/stableswap"
import { pool_account_name } from "@galacticcouncil/math-stableswap"
import { encodeAddress, blake2AsHex } from "@polkadot/util-crypto"
import { HYDRADX_SS58_PREFIX, XykMath } from "@galacticcouncil/sdk"
import { useAccountBalances } from "api/accountBalances"
import { useRpcProvider } from "providers/rpcProvider"
import { isNotNil } from "utils/helpers"
import { useOmnipoolPositionsData } from "sections/wallet/assets/hydraPositions/data/WalletAssetsHydraPositionsData.utils"
import { useVolume } from "api/volume"
import BN from "bignumber.js"
import {
  useGetXYKPools,
  useShareTokens,
  useShareTokensByIds,
  useXYKConsts,
} from "api/xyk"
import { useShareOfPools } from "api/pools"
import { TShareToken } from "api/assetDetails"
import { useXYKPoolTradeVolumes } from "./pool/details/PoolDetails.utils"
import {
  useAllOmnipoolDeposits,
  useAllXYKDeposits,
} from "./farms/position/FarmingPosition.utils"
import { useFee } from "api/stats"
import { useTVL } from "api/stats"
import { scaleHuman } from "utils/balance"
import {
  is_add_liquidity_allowed,
  is_buy_allowed,
  is_remove_liquidity_allowed,
  is_sell_allowed,
} from "@galacticcouncil/math-omnipool"
import { useUserDeposits } from "api/deposits"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"

export const XYK_TVL_VISIBILITY = 5000

export const useAssetsTradability = () => {
  const {
    assets: { hub },
  } = useRpcProvider()
  const assets = useOmnipoolAssets()
  const hubTradability = useHubAssetTradability()

  const queries = [assets, hubTradability]
  const isLoading = queries.some((q) => q.isLoading)
  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (!assets.data || !hubTradability.data) return undefined

    const results = assets.data.map((asset) => {
      const id = asset.id.toString()
      const bits = asset.data.tradable.bits.toNumber()
      const canBuy = is_buy_allowed(bits)
      const canSell = is_sell_allowed(bits)
      const canAddLiquidity = is_add_liquidity_allowed(bits)
      const canRemoveLiquidity = is_remove_liquidity_allowed(bits)

      return { id, canBuy, canSell, canAddLiquidity, canRemoveLiquidity }
    })

    const hubBits = hubTradability.data.bits.toNumber()
    const canBuyHub = is_buy_allowed(hubBits)
    const canSellHub = is_sell_allowed(hubBits)
    const canAddLiquidityHub = is_add_liquidity_allowed(hubBits)
    const canRemoveLiquidityHub = is_remove_liquidity_allowed(hubBits)
    const hubResult = {
      id: hub.id,
      canBuy: canBuyHub,
      canSell: canSellHub,
      canAddLiquidity: canAddLiquidityHub,
      canRemoveLiquidity: canRemoveLiquidityHub,
    }

    return [...results, hubResult]
  }, [assets, hubTradability, hub])

  return { data, isLoading, isInitialLoading }
}

export type TMiningNftPosition = ReturnType<
  typeof usePoolDetails
>["data"]["miningNftPositions"][number]

export const isXYKPoolType = (pool: TPool | TXYKPool): pool is TXYKPool =>
  !!(pool as TXYKPool).shareTokenIssuance

export type TPool = NonNullable<ReturnType<typeof usePools>["data"]>[number]
export type TPoolDetails = NonNullable<
  ReturnType<typeof usePoolDetails>["data"]
>
export type TPoolFullData = TPool & TPoolDetails
export type TXYKPoolFullData = TXYKPool &
  NonNullable<ReturnType<typeof useXYKPoolDetails>["data"]>

export type TXYKPool = NonNullable<
  ReturnType<typeof useXYKPools>["data"]
>[number]

export const derivePoolAccount = (assetId: string) => {
  const name = pool_account_name(Number(assetId))
  return encodeAddress(blake2AsHex(name), HYDRADX_SS58_PREFIX)
}

const getTradeFee = (fee: string[]) => {
  if (fee?.length !== 2) return BN_NAN

  const numerator = new BN(fee[0])
  const denominator = new BN(fee[1])
  const tradeFee = numerator.div(denominator)

  return tradeFee.times(100)
}

export const usePools = () => {
  const { assets } = useRpcProvider()
  const { stableCoinId } = useDisplayAssetStore()

  const omnipoolAssets = useOmnipoolAssets()
  const stablepools = useStableswapPools()

  const assetsTradability = useAssetsTradability()

  const omnipoolPositions = useOmnipoolPositionsData()
  const miningPositions = useAllOmnipoolDeposits()

  const assetsId = useMemo(
    () => omnipoolAssets.data?.map((a) => a.id.toString()) ?? [],
    [omnipoolAssets.data],
  )

  const omnipoolBalances = useTokensBalances(assetsId, OMNIPOOL_ACCOUNT_ADDRESS)

  const assetsByStablepool = [
    ...new Set(
      stablepools.data
        ?.map((stablepool) =>
          stablepool.data.assets.map((asset) => asset.toString()),
        )
        .flat(),
    ),
  ]

  const spotPrices = useDisplayPrices([
    ...assetsId,
    ...assetsByStablepool,
    stableCoinId ?? "",
  ])

  const volumes = useVolume("all")
  const fees = useFee("all")
  const tvls = useTVL("all")

  const queries = [
    omnipoolAssets,
    spotPrices,
    assetsTradability,
    ...omnipoolBalances,
  ]

  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !omnipoolAssets.data ||
      !spotPrices.data ||
      !assetsTradability.data ||
      omnipoolBalances.some((q) => !q.data)
    )
      return undefined

    const rows = assetsId.map((assetId) => {
      const meta = assets.getAsset(assetId)

      const spotPrice = spotPrices.data?.find((sp) => sp?.tokenIn === assetId)
        ?.spotPrice

      const tradabilityData = assetsTradability.data?.find(
        (t) => t.id === assetId,
      )

      const tradability = {
        canAddLiquidity: !!tradabilityData?.canAddLiquidity,
        canRemoveLiquidity: !!tradabilityData?.canRemoveLiquidity,
      }

      const apiSpotPrice = spotPrices.data?.find(
        (sp) => sp?.tokenIn === stableCoinId,
      )?.spotPrice

      const tvlDisplay = BN(
        tvls.data?.find((tvl) => tvl.asset_id === Number(assetId))?.tvl_usd ??
          BN_NAN,
      ).multipliedBy(apiSpotPrice ?? 1)

      const volume = BN(
        volumes.data?.find((volume) => volume.asset_id.toString() === assetId)
          ?.volume_usd ?? BN_NAN,
      ).multipliedBy(apiSpotPrice ?? 1)

      const fee =
        assets.native.id === assetId
          ? BN_0
          : BN(
              fees.data?.find((fee) => fee.asset_id.toString() === assetId)
                ?.projected_apr_perc ?? BN_NAN,
            )

      const filteredOmnipoolPositions = omnipoolPositions.data.filter(
        (omnipoolPosition) => omnipoolPosition.assetId === assetId,
      )

      const filteredMiningPositions = miningPositions.data?.[assetId] ?? []

      const isPositions =
        !!filteredOmnipoolPositions.length || !!filteredMiningPositions?.length

      return {
        id: assetId,
        name: meta.name,
        symbol: meta.symbol,
        tvlDisplay,
        spotPrice,
        canAddLiquidity: tradability.canAddLiquidity,
        canRemoveLiquidity: tradability.canRemoveLiquidity,
        volume,
        isVolumeLoading: volumes.isLoading,
        fee,
        isFeeLoading: fees.isLoading,
        omnipoolPositions: filteredOmnipoolPositions,
        miningPositions: filteredMiningPositions,
        isPositions,
      }
    })

    return rows.sort((poolA, poolB) => {
      if (poolA.id === NATIVE_ASSET_ID) {
        return -1
      }

      if (poolB.id === NATIVE_ASSET_ID) {
        return 1
      }

      return poolA.tvlDisplay.gt(poolB.tvlDisplay) ? -1 : 1
    })
  }, [
    assets,
    assetsId,
    assetsTradability.data,
    omnipoolAssets.data,
    omnipoolBalances,
    spotPrices.data,
    volumes,
    fees,
    tvls,
    stableCoinId,
    omnipoolPositions.data,
    miningPositions.data,
  ])

  return { data, isLoading: isInitialLoading }
}

export const usePoolDetails = (assetId: string) => {
  const { assets } = useRpcProvider()
  const meta = assets.getAsset(assetId)
  const isStablePool = assets.isStableSwap(meta)

  const { omnipoolDeposits } = useUserDeposits()
  const omnipoolPositions = useOmnipoolPositionsData()

  const poolAccountAddress = derivePoolAccount(assetId)

  const stablePoolBalance = useAccountBalances(
    isStablePool ? poolAccountAddress : undefined,
  )
  const stablepool = useStableswapPool(isStablePool ? assetId : undefined)

  const isInitialLoading =
    omnipoolPositions.isInitialLoading || stablePoolBalance.isInitialLoading

  const data = useMemo(() => {
    const omnipoolNftPositions = omnipoolPositions.data.filter(
      (position) => position.assetId === assetId,
    )

    const miningNftPositions = omnipoolDeposits
      .filter((position) => position.data.ammPoolId.toString() === assetId)
      .sort((a, b) => {
        const firstFarmLastBlock = a.data.yieldFarmEntries.reduce(
          (acc, curr) =>
            acc.lt(curr.enteredAt.toBigNumber())
              ? curr.enteredAt.toBigNumber()
              : acc,
          BN_0,
        )

        const secondFarmLastBlock = b.data.yieldFarmEntries.reduce(
          (acc, curr) =>
            acc.lt(curr.enteredAt.toBigNumber())
              ? curr.enteredAt.toBigNumber()
              : acc,
          BN_0,
        )

        return secondFarmLastBlock.minus(firstFarmLastBlock).toNumber()
      })

    const reserves = isStablePool
      ? (stablePoolBalance.data?.balances ?? []).map((balance) => {
          const id = balance.id.toString()
          const meta = assets.getAsset(id)

          return {
            asset_id: Number(id),
            decimals: meta.decimals,
            amount: balance.freeBalance.toString(),
          }
        })
      : []

    return {
      omnipoolNftPositions,
      miningNftPositions,
      reserves,
      stablepoolFee: stablepool.data?.fee
        ? normalizeBigNumber(stablepool.data.fee).div(BN_MILL)
        : undefined,
      isStablePool,
    }
  }, [
    assetId,
    assets,
    isStablePool,
    omnipoolDeposits,
    omnipoolPositions.data,
    stablePoolBalance.data?.balances,
    stablepool.data?.fee,
  ])

  return { data, isInitialLoading }
}

export const useMyPools = () => {
  const { account } = useAccount()
  const { assets } = useRpcProvider()

  const pools = usePools()

  const omnipoolPositions = useOmnipoolPositionsData()
  const miningPositions = useAllOmnipoolDeposits()

  const stableswapsId = assets.stableswap.map((shareToken) => shareToken.id)

  const userPositions = useTokensBalances(stableswapsId, account?.address)

  const data = useMemo(() => {
    if (
      pools.data &&
      omnipoolPositions.data &&
      miningPositions.data &&
      userPositions.every((userPosition) => userPosition.data)
    ) {
      return pools.data?.filter(
        (pool) =>
          omnipoolPositions.data.some(
            (omnipoolPosition) => omnipoolPosition.assetId === pool.id,
          ) ||
          miningPositions.data?.[pool.id] ||
          userPositions.some(
            (userPosition) =>
              userPosition.data?.assetId === pool.id &&
              userPosition.data.balance.gt(0),
          ),
      )
    }
    return undefined
  }, [miningPositions.data, omnipoolPositions.data, pools.data, userPositions])

  return {
    data,
    isLoading:
      pools.isLoading ||
      omnipoolPositions.isInitialLoading ||
      miningPositions.isLoading,
  }
}

export const useXYKPools = (withPositions?: boolean) => {
  const { assets } = useRpcProvider()

  const pools = useGetXYKPools()
  const xykConsts = useXYKConsts()

  const shareTokens = useShareTokens()

  const shareTokensId =
    shareTokens.data?.map((shareToken) => shareToken.shareTokenId) ?? []

  const totalIssuances = useShareOfPools(shareTokensId)
  const shareTokeSpotPrices = useDisplayShareTokenPrice(shareTokensId)

  const fee = xykConsts.data?.fee ? getTradeFee(xykConsts.data?.fee) : BN_NAN

  const volumes = useXYKPoolTradeVolumes(
    shareTokens.data
      ? shareTokens.data.map((shareToken) => shareToken.poolAddress)
      : [],
  )

  const deposits = useAllXYKDeposits()

  const queries = [
    pools,
    shareTokens,
    xykConsts,
    shareTokeSpotPrices,
    totalIssuances,
  ]

  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !pools.data ||
      !shareTokens.data ||
      !shareTokeSpotPrices.data ||
      !totalIssuances.data
    )
      return undefined

    return pools.data
      .map((pool) => {
        const shareTokenId = shareTokens.data?.find(
          (shareToken) => shareToken.poolAddress === pool.poolAddress,
        )?.shareTokenId

        if (!shareTokenId) return undefined

        const shareTokenMeta = assets.getAsset(shareTokenId) as TShareToken

        if (!shareTokenMeta.isShareToken) return undefined

        const shareTokenIssuance = totalIssuances.data?.find(
          (issuance) => issuance.asset === shareTokenId,
        )

        const shareTokenSpotPrice = shareTokeSpotPrices.data.find(
          (shareTokeSpotPrice) => shareTokeSpotPrice.tokenIn === shareTokenId,
        )

        const tvlDisplay =
          shareTokenIssuance?.totalShare
            ?.shiftedBy(-shareTokenMeta.decimals)
            ?.multipliedBy(shareTokenSpotPrice?.spotPrice ?? 1) ?? BN_0

        const volume =
          volumes.data?.find(
            (volume) => volume.poolAddress === pool.poolAddress,
          )?.volume ?? BN_NAN

        const miningPositions = deposits.data.filter(
          (deposit) => deposit.assetId === shareTokenMeta.id,
        )

        return {
          id: shareTokenMeta.id,
          symbol: shareTokenMeta.symbol,
          name: shareTokenMeta.name,
          tvlDisplay,
          spotPrice: shareTokenSpotPrice?.spotPrice,
          fee,
          isXykPool: true,
          poolAddress: pool.poolAddress,
          canAddLiquidity: true,
          canRemoveLiquidity: true,
          shareTokenIssuance,
          volume,
          isVolumeLoading: volumes.isLoading,
          miningPositions,
        }
      })
      .filter(isNotNil)
      .filter((pool) =>
        withPositions
          ? pool.shareTokenIssuance?.myPoolShare?.gt(0) ||
            pool.miningPositions.length
          : true,
      )
      .sort((a, b) => b.tvlDisplay.minus(a.tvlDisplay).toNumber())
  }, [
    assets,
    fee,
    pools.data,
    shareTokeSpotPrices.data,
    shareTokens.data,
    totalIssuances.data,
    withPositions,
    volumes,
    deposits,
  ])

  return { data, isInitialLoading }
}

export const useXYKPoolDetails = (pool: TXYKPool) => {
  const volume = useXYKPoolTradeVolumes([pool.poolAddress])
  const { xykDeposits } = useUserDeposits()

  const isInitialLoading = volume.isLoading

  const miningNftPositions = xykDeposits
    .filter(
      (position) => position.data.ammPoolId.toString() === pool.poolAddress,
    )
    .sort((a, b) => {
      const firstFarmLastBlock = a.data.yieldFarmEntries.reduce(
        (acc, curr) =>
          acc.lt(curr.enteredAt.toBigNumber())
            ? curr.enteredAt.toBigNumber()
            : acc,
        BN_0,
      )

      const secondFarmLastBlock = b.data.yieldFarmEntries.reduce(
        (acc, curr) =>
          acc.lt(curr.enteredAt.toBigNumber())
            ? curr.enteredAt.toBigNumber()
            : acc,
        BN_0,
      )

      return secondFarmLastBlock.minus(firstFarmLastBlock).toNumber()
    })

  return {
    data: {
      volumeDisplay: volume.data?.[0]?.volume ?? BN_0,
      miningNftPositions,
    },
    isInitialLoading,
  }
}

export const useXYKSpotPrice = (shareTokenId: string) => {
  const { assets } = useRpcProvider()
  const pool = useShareTokensByIds([shareTokenId])

  const poolAddress = pool.data?.[0]?.poolAddress
  const metaShareToken = assets.getAsset(shareTokenId) as TShareToken
  const [metaA, metaB] = assets.getAssets(metaShareToken.assets)

  const assetABalance = useTokenBalance(metaA.id, poolAddress)
  const assetBBalance = useTokenBalance(metaB.id, poolAddress)

  if (!assetABalance.data || !assetBBalance.data) return undefined

  const priceA = scaleHuman(
    XykMath.getSpotPrice(
      assetABalance.data.balance.toString(),
      assetBBalance.data.balance.toString(),
      BN_1.shiftedBy(metaA.decimals).toString(),
    ),
    metaB.decimals,
  )

  const priceB = scaleHuman(
    XykMath.getSpotPrice(
      assetBBalance.data.balance.toString(),
      assetABalance.data.balance.toString(),
      BN_1.shiftedBy(metaB.decimals).toString(),
    ),
    metaA.decimals,
  )

  return { priceA, priceB, idA: metaA.id, idB: metaB.id }
}

export const useXYKDepositValues = (depositNfts: TMiningNftPosition[]) => {
  const { assets } = useRpcProvider()
  const depositNftsData = depositNfts.reduce<
    { assetId: string; depositNft: TMiningNftPosition }[]
  >((acc, depositNft) => {
    const assetId = assets.getShareTokenByAddress(
      depositNft.data.ammPoolId.toString(),
    )?.id

    if (assetId)
      acc.push({
        assetId,
        depositNft,
      })
    return acc
  }, [])

  const uniqAssetIds = [
    ...new Set(depositNftsData.map((deposit) => deposit.assetId)),
  ]
  const totalIssuances = useShareOfPools(uniqAssetIds)
  const balances = useShareTokenBalances(uniqAssetIds)
  const shareTokeSpotPrices = useDisplayShareTokenPrice(uniqAssetIds)

  const isLoading =
    totalIssuances.isInitialLoading ||
    balances.some((q) => q.isInitialLoading) ||
    shareTokeSpotPrices.isInitialLoading

  const data = useMemo(() => {
    const defaultValue = {
      assetA: undefined,
      assetB: undefined,
      amountUSD: undefined,
    }

    return depositNftsData.map((deposit) => {
      const shareTokenIssuance = totalIssuances.data?.find(
        (totalIssuance) => totalIssuance.asset === deposit.assetId,
      )?.totalShare

      if (!shareTokenIssuance) {
        return { ...defaultValue, assetId: deposit.assetId }
      }

      const shareTokenMeta = assets.getAsset(deposit.assetId) as TShareToken
      const shares = deposit.depositNft.data.shares.toBigNumber()
      const ratio = shares.div(shareTokenIssuance)
      const amountUSD = scaleHuman(shareTokenIssuance, shareTokenMeta.decimals)
        .multipliedBy(shareTokeSpotPrices.data?.[0]?.spotPrice ?? 1)
        .times(ratio)

      const [assetA, assetB] = shareTokenMeta.assets.map((asset) => {
        const meta = assets.getAsset(asset)
        const balance =
          balances.find(
            (balance) =>
              balance.data?.assetId === asset &&
              balance.data?.accountId.toString() === shareTokenMeta.poolAddress,
          )?.data?.balance ?? BN_0
        const amount = scaleHuman(balance.times(ratio), meta.decimals)

        return {
          id: asset,
          symbol: meta.symbol,
          decimals: meta.decimals,
          amount,
        }
      })
      return {
        assetA,
        assetB,
        amountUSD,
        assetId: deposit.assetId,
        depositId: deposit.depositNft.id,
      }
    })
  }, [
    assets,
    balances,
    depositNftsData,
    shareTokeSpotPrices.data,
    totalIssuances.data,
  ])

  return { data, isLoading }
}

export const useRefetchPositions = () => {
  const queryClient = useQueryClient()
  const { account } = useAccount()

  return () => {
    queryClient.refetchQueries(
      QUERY_KEYS.accountOmnipoolPositions(account?.address),
    )
  }
}
