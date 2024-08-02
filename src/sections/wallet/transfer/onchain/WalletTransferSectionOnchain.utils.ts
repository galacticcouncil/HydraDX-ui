import { useAssets } from "providers/assets"
import { usePaymentInfo } from "api/transaction"
import BN from "bignumber.js"
import { useRpcProvider } from "providers/rpcProvider"
import { BN_0 } from "utils/constants"

export function usePaymentFees({
  asset,
  currentAmount,
  maxAmount,
}: {
  asset: string
  currentAmount: BN
  maxAmount: BN
}) {
  const { api } = useRpcProvider()
  const { native } = useAssets()

  const formattedCurrentAmount = !currentAmount?.isNaN()
    ? currentAmount.toString()
    : "0"

  const { data: currentData } = usePaymentInfo(
    asset.toString() === native.id
      ? api.tx.currencies.transfer("", native.id, formattedCurrentAmount)
      : api.tx.tokens.transfer("", asset, formattedCurrentAmount),
  )

  const formattedMaxAmount = !maxAmount?.isNaN() ? maxAmount.toString() : "0"

  const { data: maxData } = usePaymentInfo(
    asset.toString() === native.id
      ? api.tx.currencies.transfer("", native.id, formattedMaxAmount)
      : api.tx.tokens.transfer("", asset, formattedMaxAmount),
  )

  return {
    currentFee: currentData?.partialFee.toBigNumber() ?? BN_0,
    maxFee: maxData?.partialFee.toBigNumber() ?? BN_0,
  }
}
