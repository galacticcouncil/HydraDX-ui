import { QUERY_KEY_BLOCK_PREFIX } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"

import { Trade } from "@/api/trade"
import { ENV } from "@/config/env"
import { useEstimateFee } from "@/modules/transactions/hooks/useEstimateFee"
import { useRpcProvider } from "@/providers/rpcProvider"

export const useSwapFee = (swap: Trade) => {
  const { sdk } = useRpcProvider()
  const { account } = useAccount()
  const { data: tx, isLoading: isTxLoading } = useQuery({
    enabled: !!swap,
    queryKey: [QUERY_KEY_BLOCK_PREFIX, "trade", "swapFee", swap.type],
    queryFn: async () => {
      return sdk.tx
        .trade(swap)
        .withBeneficiary(account?.address ?? ENV.VITE_TRSRY_ADDR)
        .build()
        .then((tx) => tx.get())
    },
  })

  const { data, isPending: isTransactionFeeLoading } = useEstimateFee(
    tx ?? null,
  )

  return {
    data,
    isLoading: isTxLoading || isTransactionFeeLoading,
  }
}
