import { PoolType } from "@/api/pools"
import { Trade } from "@/api/trade"

export const isTwapEnabled = (swapData: Trade | undefined): boolean =>
  swapData?.swaps.every(
    (swap) => ![PoolType.LBP, PoolType.XYK].includes(swap.pool),
  ) ?? true
