import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ToastMessage, useStore } from "state/store"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { QUERY_KEYS } from "utils/queryKeys"
import { useAssets } from "providers/assets"
import { TDeposit } from "api/deposits"

export const useFarmExitAllMutation = (
  depositNfts: TDeposit[],
  poolId: string,
  toast: ToastMessage,
  onClose?: () => void,
) => {
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const { account } = useAccount()
  const { getAssetWithFallback, isShareToken } = useAssets()
  const queryClient = useQueryClient()

  const meta = getAssetWithFallback(poolId)
  const isXYK = isShareToken(meta)

  return useMutation(
    async () => {
      const txs =
        depositNfts
          ?.map((record) => {
            return record.data.yieldFarmEntries.map((entry) => {
              return isXYK
                ? api.tx.xykLiquidityMining.withdrawShares(
                    record.id,
                    entry.yieldFarmId,
                    { assetIn: meta.assets[0], assetOut: meta.assets[1] },
                  )
                : api.tx.omnipoolLiquidityMining.withdrawShares(
                    record.id,
                    entry.yieldFarmId,
                  )
            })
          })
          .flat(2) ?? []

      if (txs.length > 1) {
        return await createTransaction(
          { tx: api.tx.utility.batchAll(txs) },
          { toast, onClose, onBack: () => {} },
        )
      } else {
        return await createTransaction(
          { tx: txs[0] },
          { toast, onClose, onBack: () => {} },
        )
      }
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(
          QUERY_KEYS.tokenBalance(meta.id, account?.address),
        )
        queryClient.refetchQueries(
          QUERY_KEYS.accountPositions(account?.address),
        )
      },
    },
  )
}
