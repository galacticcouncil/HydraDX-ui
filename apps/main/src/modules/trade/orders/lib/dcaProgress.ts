import Big from "big.js"

import { useAccountBalances } from "@/api/balances"
import { TAsset } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

export const useDcaFundingBalance = (
  from: TAsset | undefined,
  isOpenBudget: boolean,
): string | null => {
  const { getTransferableBalance, isBalanceLoading } = useAccountBalances()

  if (!isOpenBudget || !from || isBalanceLoading) return null

  return scaleHuman(getTransferableBalance(from.id).toString(), from.decimals)
}

type DcaAmountsArgs = {
  readonly sold: string | null | undefined
  readonly total: string | null | undefined
  readonly isOpenBudget: boolean
  readonly fundingBalance: string | null
}

const getDcaAmounts = ({
  sold,
  total,
  isOpenBudget,
  fundingBalance,
}: DcaAmountsArgs): { filled: Big; left: Big } | null => {
  if (sold === undefined || sold === null) return null

  try {
    const filled = Big(sold)

    if (isOpenBudget) {
      if (fundingBalance === null) return null
      return { filled, left: Big(fundingBalance) }
    }

    if (total === undefined || total === null) return null

    const budget = Big(total)
    if (budget.lte(0)) return null

    return { filled, left: budget.gt(filled) ? budget.minus(filled) : Big(0) }
  } catch {
    return null
  }
}

export const getDcaCompletionPercent = (
  args: DcaAmountsArgs,
): number | null => {
  const amounts = getDcaAmounts(args)
  if (!amounts) return null

  const { filled, left } = amounts
  const budget = filled.plus(left)

  if (budget.lte(0)) return null

  return filled.gte(budget) ? 100 : filled.div(budget).mul(100).toNumber()
}

export const getDcaTradeProgress = ({
  singleTradeSize,
  ...args
}: DcaAmountsArgs & {
  readonly singleTradeSize: string | null | undefined
}): { executed: number; remaining: number } | null => {
  if (singleTradeSize === undefined || singleTradeSize === null) return null

  const amounts = getDcaAmounts(args)
  if (!amounts) return null

  try {
    const perTrade = Big(singleTradeSize)
    if (perTrade.lte(0)) return null

    const executed = amounts.filled
      .div(perTrade)
      .round(0, Big.roundDown)
      .toNumber()
    const remaining = amounts.left
      .div(perTrade)
      .round(0, Big.roundUp)
      .toNumber()

    if (!Number.isFinite(executed) || !Number.isFinite(remaining)) return null
    if (executed < 0 || remaining < 0) return null

    return { executed, remaining }
  } catch {
    return null
  }
}
