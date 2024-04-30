import { MarketDataType } from "./marketsConfig"

export const queryKeysFactory = {
  pool: ["pool"] as const,
  incentives: ["incentives"] as const,
  gho: ["gho"] as const,
  market: (marketData: MarketDataType) => [
    marketData.chainId,
    !!marketData.isFork,
    marketData.market,
  ],
  user: (user: string) => [user],
  transactionHistory: (user: string, marketData: MarketDataType) => [
    ...queryKeysFactory.user(user),
    ...queryKeysFactory.market(marketData),
    "transactionHistory",
  ],
  poolTokens: (user: string, marketData: MarketDataType) => [
    ...queryKeysFactory.pool,
    ...queryKeysFactory.user(user),
    ...queryKeysFactory.market(marketData),
    "poolTokens",
  ],
  poolReservesDataHumanized: (marketData: MarketDataType) => [
    ...queryKeysFactory.pool,
    ...queryKeysFactory.market(marketData),
    "poolReservesDataHumanized",
  ],
  paraswapRates: (
    chainId: number,
    amount: string,
    srcToken: string,
    destToken: string,
    user: string,
  ) => [
    ...queryKeysFactory.user(user),
    chainId,
    amount,
    srcToken,
    destToken,
    "paraswapRates",
  ],
  gasPrices: (chainId: number) => [chainId, "gasPrices"],
  poolApprovedAmount: (
    user: string,
    token: string,
    marketData: MarketDataType,
  ) => [
    ...queryKeysFactory.pool,
    ...queryKeysFactory.user(user),
    ...queryKeysFactory.market(marketData),
    token,
    "poolApprovedAmount",
  ],
  approvedAmount: (
    user: string,
    token: string,
    spender: string,
    marketData: MarketDataType,
  ) => [
    ...queryKeysFactory.user(user),
    ...queryKeysFactory.market(marketData),
    token,
    spender,
    "approvedAmount",
  ],
  tokenPowers: (user: string, token: string, chainId: number) => [
    ...queryKeysFactory.user(user),
    token,
    chainId,
    "tokenPowers",
  ],
  tokenDelegatees: (user: string, token: string, chainId: number) => [
    ...queryKeysFactory.user(user),
    token,
    chainId,
    "tokenDelegatees",
  ],
}

export const POLLING_INTERVAL = 60000
