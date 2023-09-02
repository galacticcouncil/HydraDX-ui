import type { u32 } from "@polkadot/types"
import { u128 } from "@polkadot/types-codec"
import type { AccountId32 } from "@polkadot/types/interfaces"
import { CodecHash } from "@polkadot/types/interfaces/runtime"
import { StatsTimeframe } from "api/stats"
import type BigNumber from "bignumber.js"
import { Maybe } from "utils/helpers"
import { ChartType } from "sections/stats/components/ChartsWrapper/ChartsWrapper"

export const QUERY_KEY_PREFIX = "@block"

export const QUERY_KEYS = {
  providerAccounts: (provider: string | undefined) => [
    "web3Accounts",
    provider,
  ],
  walletEnable: (provider: string | null) => ["web3Enable", provider],
  bestNumber: [QUERY_KEY_PREFIX, "bestNumber"],
  assetsTable: (id: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "assetsTable",
    id?.toString(),
  ],
  omniPositionId: (id: u128 | string) => [
    QUERY_KEY_PREFIX,
    "omniPositionId",
    id?.toString(),
  ],
  accountBalances: (id: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "accountBalances",
    id?.toString(),
  ],
  accountAssetBalances: (
    pairs: Array<[address: AccountId32 | string, assetId: u32 | string]>,
  ) => [QUERY_KEY_PREFIX, "accountAssetBalances", pairs],
  pools: [QUERY_KEY_PREFIX, "pools"],
  poolShareToken: (poolId: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "poolShareToken",
    poolId.toString(),
  ],
  poolAssets: (address: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "poolAssets",
    address.toString(),
  ],
  deposit: (id: Maybe<u128>) => [QUERY_KEY_PREFIX, "deposit", id?.toString()],
  allDeposits: [QUERY_KEY_PREFIX, "deposits"],
  poolDeposits: (poolId: Maybe<u32 | string>) => [
    QUERY_KEY_PREFIX,
    "deposits",
    poolId?.toString(),
  ],
  accountDepositIds: (accountId: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "depositIds",
    accountId?.toString(),
  ],
  globalFarms: (ids: Maybe<{ globalFarmId: u32 }[]>) => [
    QUERY_KEY_PREFIX,
    "globalFarms",
    ids?.map((i) => i.globalFarmId.toString()),
  ],
  yieldFarms: (
    ids: Maybe<
      {
        poolId: u32 | string
        globalFarmId: u32 | string
        yieldFarmId: u32 | string
      }[]
    >,
  ) => [QUERY_KEY_PREFIX, "yieldFarms", ids],
  activeYieldFarms: (poolId: Maybe<u32 | string>) => [
    QUERY_KEY_PREFIX,
    "activeYieldFarms",
    poolId?.toString(),
  ],
  globalFarm: (id: Maybe<u32 | string>) => [
    QUERY_KEY_PREFIX,
    "globalFarm",
    id?.toString(),
  ],
  yieldFarm: (ids: {
    poolId: Maybe<u32 | string>
    globalFarmId: Maybe<u32 | string>
    yieldFarmId: Maybe<u32 | string>
  }) => [QUERY_KEY_PREFIX, "yieldFarm", ids],
  activeYieldFarm: (id: string) => [QUERY_KEY_PREFIX, "activeYieldFarm", id],
  totalLiquidity: (id: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "totalLiquidity",
    id?.toString(),
  ],
  totalIssuance: (lpToken: Maybe<u32>) => [
    QUERY_KEY_PREFIX,
    "totalIssuance",
    lpToken?.toString(),
  ],
  LRNATotalIssuance: () => ["LRNATotalIssuance"],
  LRNAOmnipoolBalance: () => ["LRNAOmnipoolBalance"],
  LRNAMeta: () => ["LRNAMeta"],
  totalLiquidities: (ids: string[]) => [
    QUERY_KEY_PREFIX,
    "totalLiquidities",
    ...ids,
  ],
  reserves: (id: Maybe<string | u32>, address: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "reserves",
    id?.toString(),
    address,
  ],
  tokenBalance: (
    id: Maybe<string | u32>,
    address: Maybe<AccountId32 | string>,
  ) => ["tokenBalance", id?.toString(), address],
  tokenBalanceLive: (
    id: Maybe<string | u32>,
    address: Maybe<AccountId32 | string>,
  ) => [QUERY_KEY_PREFIX, "tokenBalance", id?.toString(), address],
  tokensBalances: (ids: string[], address?: string) => [
    QUERY_KEY_PREFIX,
    "tokenBalances",
    address,
    ...ids,
  ],
  assets: ["assets"],
  assetsLive: [QUERY_KEY_PREFIX, "assets"],
  assetsMeta: ["assetsMeta"],
  tradeAssets: [QUERY_KEY_PREFIX, "tradeAssets"],
  exchangeFee: [QUERY_KEY_PREFIX, "exchangeFee"],
  calculateTotalLiqInPools: [QUERY_KEY_PREFIX, "totalLiqInPools"],
  spotPrice: (assetA: string, assetB: string) => ["spotPrice", assetA, assetB],
  spotPriceLive: (assetA: string, assetB: string) => [
    QUERY_KEY_PREFIX,
    "spotPrice",
    assetA,
    assetB,
  ],
  oraclePrice: (
    rewardCurrency: Maybe<string>,
    incentivizedAsset: Maybe<string>,
  ) => [QUERY_KEY_PREFIX, "oraclePrice", rewardCurrency, incentivizedAsset],
  paymentInfo: (hash: CodecHash, account?: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "paymentInfo",
    hash,
    account,
  ],
  nextNonce: (account: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "nonce",
    account,
  ],
  bestBuy: (params: Record<string, any>) => [
    QUERY_KEY_PREFIX,
    "bestBuy",
    params,
  ],
  bestSell: (params: Record<string, any>) => [
    QUERY_KEY_PREFIX,
    "bestSell",
    params,
  ],
  mathLoyaltyRates: (
    plannedYieldingPeriods: u32,
    initialRewardPercentage: Maybe<u128>,
    scaleCoef: Maybe<u32>,
    periodsInFarm: Maybe<string>,
  ) => [
    "mathLoyaltyRates",
    plannedYieldingPeriods,
    initialRewardPercentage?.toString(),
    scaleCoef?.toString(),
    periodsInFarm,
  ],
  minWithdrawalFee: ["minWithdrawalFee"],
  allTrades: ["allTrades"],
  tradeVolume: (poolId: Maybe<string | u32>) => [
    "tradeVolume",
    poolId?.toString(),
  ],
  tradeVolumeLive: (poolId: Maybe<string | u32>) => [
    QUERY_KEY_PREFIX,
    "tradeVolume",
    poolId?.toString(),
  ],
  timestamp: (bestNumber: Maybe<u32 | BigNumber>) =>
    bestNumber != null
      ? ["timestamp", bestNumber]
      : [QUERY_KEY_PREFIX, "timestamp"],
  vestingSchedules: (address: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "vestingSchedules",
    address,
  ],
  vestingLockBalance: (address: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "vestingLock",
    address,
  ],
  lock: (address: Maybe<AccountId32 | string>, asset: Maybe<u32 | string>) => [
    "lock",
    address,
    asset,
  ],
  uniques: (address?: string | AccountId32, collectionId?: string | u128) => [
    "uniques",
    address?.toString(),
    collectionId?.toString(),
  ],
  uniquesLive: (
    address?: string | AccountId32,
    collectionId?: string | u128,
  ) => [
    QUERY_KEY_PREFIX,
    "uniques",
    address?.toString(),
    collectionId?.toString(),
  ],
  uniquesAsset: (collectionId: string | u128) => [
    "uniquesAsset",
    collectionId.toString(),
  ],
  uniquesAssetLive: (collectionId: string | u128) => [
    QUERY_KEY_PREFIX,
    "uniquesAsset",
    collectionId.toString(),
  ],
  omnipoolAssets: ["omnipoolAssets"],
  omnipoolAssetsLive: [QUERY_KEY_PREFIX, "omnipoolAssets"],
  hubAssetTradability: [QUERY_KEY_PREFIX, "hubAssetTradability"],
  hubAssetImbalance: () => ["hubAssetImbalance"],
  omnipoolFee: [QUERY_KEY_PREFIX, "omnipoolFee"],
  omnipoolAsset: (id: u32 | string) => [
    QUERY_KEY_PREFIX,
    "omnipoolAsset",
    id?.toString(),
  ],
  omnipoolPositions: [QUERY_KEY_PREFIX, "omnipoolPositions"],
  omnipoolPosition: (id: string | undefined) => [
    "omnipoolPosition",
    id?.toString(),
  ],
  omnipoolPositionLive: (id: string | undefined) => [
    QUERY_KEY_PREFIX,
    "omnipoolPosition",
    id?.toString(),
  ],
  otcOrders: [QUERY_KEY_PREFIX, "otcOrders"],
  otcOrdersTable: [QUERY_KEY_PREFIX, "otcOrdersTable"],
  otcOrdersState: (orderId: Maybe<string | u32>) => [
    QUERY_KEY_PREFIX,
    "otcOrdersState",
    orderId?.toString(),
  ],
  provider: (url: string) => ["provider", url],
  math: ["@galacticcouncil/math"],
  existentialDeposit: [QUERY_KEY_PREFIX, "existentialDeposit"],
  metadataVersion: ["metadataVersion"],
  acceptedCurrencies: (address: Maybe<u32 | string>) => [
    QUERY_KEY_PREFIX,
    "acceptedCurrencies",
    address,
  ],
  acceptedCurrency: (id: Maybe<u32 | string>) => [
    QUERY_KEY_PREFIX,
    "acceptedCurrency",
    id,
  ],
  accountCurrency: (address: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "accountCurrency",
    address,
  ],
  apiIds: ["apiIds"],
  tvlCap: ["tvlCap"],
  externalWalletKey: (walletAddress: string) => [
    "externalWallet",
    walletAddress,
  ],
  polkadotAccounts: ["polkadotAccounts"],
  maxAddLiquidityLimit: ["maxAddLiquidityLimit"],
  coingeckoUsd: ["coingeckoUsd"],
  assetList: ["assetList"],
  assetsLocation: ["assetsLocation"],
  polStats: ["polStats"],
  referendums: (accountAddress?: string) => [
    QUERY_KEY_PREFIX,
    accountAddress,
    "referendums",
  ],
  referendumInfo: (id?: string) => [id, "referendumInfo"],
  referendumInfoOf: (id: string) => [QUERY_KEY_PREFIX, id, "referendumInfoOf"],
  stats: (
    type: ChartType,
    timeframe?: StatsTimeframe,
    assetSymbol?: string,
  ) => {
    const key = ["stats", type]

    if (timeframe) key.push(timeframe)
    if (assetSymbol) key.push(assetSymbol)

    return key
  },
  circulatingSupply: ["circulatingSupply"],
  stake: (address: string | undefined) => ["stake", address],
  staking: ["staking"],
  stakingPosition: (id: number | undefined) => ["totalStaking", id],
  stakingConsts: ["stakingConsts"],
  stakingEvents: ["stakingEvents"],
  stakingPositionBalances: (positionId: Maybe<string>) => [
    "positionBalances",
    positionId,
  ],
} as const
