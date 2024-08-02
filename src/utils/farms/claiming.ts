import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { useMutation } from "@tanstack/react-query"
import { useAccountAssetBalances } from "api/accountBalances"
import { useBestNumber } from "api/chain"
import { TDeposit, useAccountPositions } from "api/deposits"
import { useFarms, useInactiveFarms, useOraclePrices } from "api/farms"
import { useOmnipoolAssets } from "api/omnipool"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { ToastMessage, useStore } from "state/store"
import { getFloatingPointAmount } from "utils/balance"
import { BN_0 } from "utils/constants"
import { useDisplayPrices } from "utils/displayAsset"
import { getAccountResolver } from "./claiming/accountResolver"
import { OmnipoolLiquidityMiningClaimSim } from "./claiming/claimSimulator"
import { MultiCurrencyContainer } from "./claiming/multiCurrency"
import { createMutableFarmEntry } from "./claiming/mutableFarms"
import { useRpcProvider } from "providers/rpcProvider"
import { TAsset, useAssets } from "providers/assets"

export const useClaimableAmount = (poolId?: string, depositNft?: TDeposit) => {
  const bestNumberQuery = useBestNumber()
  const { api } = useRpcProvider()
  const { omnipoolDeposits = [], xykDeposits = [] } =
    useAccountPositions().data ?? {}
  const {
    getShareTokenByAddress,
    shareTokens,
    getAsset,
    isShareToken,
    getAssets,
  } = useAssets()

  const meta = poolId ? getAsset(poolId) : undefined
  const isXYK = isShareToken(meta)

  const filteredDeposits = useMemo(
    () =>
      poolId && meta
        ? [...omnipoolDeposits, ...xykDeposits].filter((deposit) => {
            return (
              deposit.data.ammPoolId.toString() ===
              (isXYK ? meta.poolAddress : poolId)
            )
          }) ?? []
        : [...omnipoolDeposits, ...xykDeposits],
    [isXYK, meta, omnipoolDeposits, poolId, xykDeposits],
  )

  const omnipoolAssets = useOmnipoolAssets()

  const poolIds = poolId
    ? [poolId]
    : [
        ...(omnipoolAssets.data?.map((asset) => asset.id.toString()) ?? []),
        ...shareTokens.map((asset) => asset.id),
      ]

  const farms = useFarms(poolIds)

  const inactiveFarms = useInactiveFarms(poolIds)

  const allFarms = useMemo(
    () => [...(farms.data ?? []), ...(inactiveFarms.data ?? [])],
    [farms.data, inactiveFarms.data],
  )

  const accountResolver = getAccountResolver(api.registry)

  const assetIds = [
    ...new Set(allFarms.map((i) => i.globalFarm.rewardCurrency.toString())),
  ]

  const metas = getAssets(assetIds) as TAsset[]
  const spotPrices = useDisplayPrices(assetIds)

  const accountAddresses = useMemo(
    () =>
      allFarms
        ?.map(({ globalFarm, poolId }) => {
          const isXyk = getAsset(poolId)?.isShareToken
          return [
            [accountResolver(0, isXyk), globalFarm.rewardCurrency],
            [accountResolver(globalFarm.id, isXyk), globalFarm.rewardCurrency],
          ] as [AccountId32, u32][]
        })
        .flat(1) ?? [],
    [accountResolver, allFarms, getAsset],
  )

  const oracleAssetIds = allFarms.map((farm) => ({
    rewardCurrency: farm.globalFarm.rewardCurrency.toString(),
    incentivizedAsset: farm.globalFarm.incentivizedAsset.toString(),
  }))

  const oraclePrices = useOraclePrices(oracleAssetIds ?? [])
  const accountBalances = useAccountAssetBalances(accountAddresses)

  const queries = [
    bestNumberQuery,
    farms,
    inactiveFarms,
    accountBalances,
    spotPrices,
  ]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (
      !bestNumberQuery.data ||
      !filteredDeposits.length ||
      !accountBalances.data ||
      !spotPrices.data
    )
      return undefined

    const deposits = depositNft != null ? [depositNft] : filteredDeposits ?? []
    const bestNumber = bestNumberQuery

    const multiCurrency = new MultiCurrencyContainer(
      accountAddresses,
      accountBalances.data ?? [],
    )
    const simulator = new OmnipoolLiquidityMiningClaimSim(
      getAccountResolver(api.registry),
      multiCurrency,
      metas ?? [],
    )

    return deposits
      ?.map((record) =>
        record.data.yieldFarmEntries.map((farmEntry) => {
          const poolId = record.isXyk
            ? getShareTokenByAddress(record.data.ammPoolId.toString())?.id
            : record.data.ammPoolId.toString()

          const aprEntry = allFarms.find(
            (i) =>
              i.globalFarm.id.eq(farmEntry.globalFarmId) &&
              i.yieldFarm.id.eq(farmEntry.yieldFarmId) &&
              i.poolId === poolId,
          )

          if (!aprEntry) return null

          const oracle = oraclePrices.find(
            (oracle) =>
              oracle.data?.id.incentivizedAsset ===
                aprEntry.globalFarm.incentivizedAsset.toString() &&
              aprEntry.globalFarm.rewardCurrency.toString() ===
                oracle.data.id.rewardCurrency,
          )

          if (!oracle?.data) return null

          const { globalFarm, yieldFarm } = createMutableFarmEntry(aprEntry)

          const reward = simulator.claim_rewards(
            globalFarm,
            yieldFarm,
            farmEntry,
            bestNumber.data.relaychainBlockNumber.toBigNumber(),
            oracle.data.oraclePrice ??
              aprEntry.globalFarm.priceAdjustment.toBigNumber(),
          )

          const spotPrice = spotPrices.data?.find(
            (spot) => spot?.tokenIn === reward?.assetId,
          )

          const meta = reward?.assetId ? getAsset(reward.assetId) : undefined

          if (!reward || !spotPrice) return null

          return {
            displayValue: getFloatingPointAmount(
              reward.value.multipliedBy(spotPrice.spotPrice),
              meta?.decimals ?? 12,
            ),
            asset: {
              id: reward?.assetId,
              value: reward.value,
              yieldFarmId: aprEntry.yieldFarm.id.toString(),
            },
          }
        }),
      )
      .flat(2)
      .reduce<{
        displayValue: BigNumber
        depositRewards: Array<{
          assetId: string
          yieldFarmId: string
          value: BigNumber
        }>
        assets: Record<string, BigNumber>
      }>(
        (memo, item) => {
          if (item == null) return memo
          const { id, value, yieldFarmId } = item.asset

          memo.displayValue = memo.displayValue.plus(item.displayValue)

          memo.depositRewards.push({ yieldFarmId, assetId: id, value })
          !memo.assets[id]
            ? (memo.assets[id] = value)
            : (memo.assets[id] = memo.assets[id].plus(value))

          return memo
        },
        { displayValue: BN_0, assets: {}, depositRewards: [] },
      )
  }, [
    bestNumberQuery,
    filteredDeposits,
    accountBalances.data,
    spotPrices.data,
    depositNft,
    accountAddresses,
    api.registry,
    metas,
    getShareTokenByAddress,
    allFarms,
    oraclePrices,
    getAsset,
  ])

  return { data, isLoading }
}

export const useClaimFarmMutation = (
  poolId?: string,
  depositNft?: TDeposit,
  toast?: ToastMessage,
  onClose?: () => void,
  onBack?: () => void,
) => {
  const { api } = useRpcProvider()
  const { getAsset, isShareToken } = useAssets()
  const { createTransaction } = useStore()
  const meta = poolId ? getAsset(poolId) : undefined
  const isXYK = isShareToken(meta)

  const { omnipoolDeposits = [], xykDeposits = [] } =
    useAccountPositions().data ?? {}

  let omnipoolDeposits_: TDeposit[] = []
  let xykDeposits_: TDeposit[] = []

  if (depositNft) {
    if (isXYK) {
      xykDeposits_ = [depositNft]
    } else {
      omnipoolDeposits_ = [depositNft]
    }
  } else {
    if (poolId) {
      if (isXYK) {
        xykDeposits_ = xykDeposits.filter(
          (deposit) => deposit.data.ammPoolId.toString() === meta.poolAddress,
        )
      } else {
        omnipoolDeposits_ = omnipoolDeposits.filter(
          (deposit) => deposit.data.ammPoolId.toString() === poolId,
        )
      }
    } else {
      xykDeposits_ = xykDeposits
      omnipoolDeposits_ = omnipoolDeposits
    }
  }

  return useMutation(async () => {
    const omnipoolTxs =
      omnipoolDeposits_
        .map((deposit) =>
          deposit.data.yieldFarmEntries.map((entry) =>
            api.tx.omnipoolLiquidityMining.claimRewards(
              deposit.id,
              entry.yieldFarmId,
            ),
          ),
        )
        .flat(2) ?? []

    const xykTxs =
      xykDeposits_
        .map((deposit) =>
          deposit.data.yieldFarmEntries.map((entry) =>
            api.tx.xykLiquidityMining.claimRewards(
              deposit.id,
              entry.yieldFarmId,
            ),
          ),
        )
        .flat(2) ?? []

    const allTxs = [...omnipoolTxs, ...xykTxs]

    if (allTxs.length > 0) {
      return await createTransaction(
        {
          tx: allTxs.length > 1 ? api.tx.utility.forceBatch(allTxs) : allTxs[0],
        },
        { toast, onBack, onClose },
      )
    }
  })
}
