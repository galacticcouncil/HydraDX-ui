import { HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"
import { hoursToMilliseconds } from "date-fns"

export const PORTFOLIO_CACHE_BUSTER = "portfolio-v1"
export const PORTFOLIO_CACHE_MAX_AGE = hoursToMilliseconds(24)

export const PORTFOLIO_CHAINS: string[] = [
  "ethereum",
  "robinhood",
  "base",
  "solana",
  "sui",
  "near",
  "assethub",
  "bifrost",
]

export const TRACKED_CHAINS: string[] = [
  HYDRATION_CHAIN_KEY,
  ...PORTFOLIO_CHAINS,
]
