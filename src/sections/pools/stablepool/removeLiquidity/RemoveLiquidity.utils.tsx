import {
  calculate_amplification,
  calculate_liquidity_out_one_asset,
} from "@galacticcouncil/math-stableswap"
import { useBestNumber } from "api/chain"
import { useStableswapPool } from "api/stableswap"
import { useTotalIssuance } from "api/totalIssuance"
import { normalizeBigNumber } from "utils/balance"
import { BN_0 } from "utils/constants"
import BigNumber from "bignumber.js"
import { TAsset } from "providers/assets"

type Args = {
  poolId: string
  shares: BigNumber
  asset?: TAsset
  fee: BigNumber
  reserves: { asset_id: number; amount: string }[]
}

export const useStablepoolLiquidityOut = ({
  poolId,
  asset,
  fee,
  reserves,
  shares,
}: Args) => {
  const pool = useStableswapPool(poolId)
  const bestNumber = useBestNumber()
  const currentBlock = bestNumber.data?.relaychainBlockNumber
  const shareIssuance = useTotalIssuance(poolId)

  if (!pool.data || !currentBlock || !shareIssuance?.data || !asset) {
    return ""
  }

  const amplification = calculate_amplification(
    pool.data.initialAmplification.toString(),
    pool.data.finalAmplification.toString(),
    pool.data.initialBlock.toString(),
    pool.data.finalBlock.toString(),
    currentBlock.toString(),
  )

  const result = calculate_liquidity_out_one_asset(
    JSON.stringify(reserves),
    shares.dp(0).toString(),
    Number(asset.id),
    amplification,
    shareIssuance.data.total.toString(),
    fee.toString(),
  )

  return BigNumber.maximum(
    normalizeBigNumber(result).shiftedBy(
      normalizeBigNumber(asset.decimals).negated().toNumber(),
    ),
    BN_0,
  ).toString()
}
