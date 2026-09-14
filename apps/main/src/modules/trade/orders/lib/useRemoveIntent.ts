import { useAccount } from "@galacticcouncil/web3-connect"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { useRpcProvider } from "@/providers/rpcProvider"
import { useTransactionsStore } from "@/states/transactions"

export const useRemoveIntent = () => {
  const { t } = useTranslation("trade")
  const rpc = useRpcProvider()
  const { createTransaction } = useTransactionsStore()
  const { account } = useAccount()

  const { papi } = rpc

  return useMutation({
    mutationFn: async (intentId: bigint) => {
      if (!account) throw new Error("Account not found")

      return createTransaction({
        tx: papi.tx.Intent.remove_intent({ id: intentId }),
        toasts: {
          success: t("trade.cancelIntent.success"),
          submitted: t("trade.cancelIntent.loading"),
          error: t("trade.cancelIntent.error"),
        },
      })
    },
  })
}
