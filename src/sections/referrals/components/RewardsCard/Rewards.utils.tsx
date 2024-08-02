import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTokenBalance } from "api/balances"
import { useAccountReferralShares } from "api/referrals"
import { useRpcProvider } from "providers/rpcProvider"
import { Trans } from "react-i18next"
import { ToastMessage, useStore } from "state/store"
import { TOAST_MESSAGES } from "state/toasts"
import { QUERY_KEYS } from "utils/queryKeys"
import BN from "bignumber.js"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAssets } from "providers/assets"

const potAddress = "7L53bUTCCAvmCxhe15maHwJZbjQYH89LkXuyTnTi1J58xyFC"

export const useAccountRewards = (accountAddress?: string) => {
  const { native } = useAssets()
  const referralShares = useAccountReferralShares(accountAddress)
  const potBalance = useTokenBalance(
    accountAddress ? native.id : undefined,
    potAddress,
  )

  const isLoading =
    referralShares.isInitialLoading || potBalance.isInitialLoading
  if (!isLoading && referralShares.data) {
    const { referrerShares, traderShares, totalShares } = referralShares.data
    const accountShares = referrerShares.plus(traderShares)

    const totalRewards = accountShares
      .div(totalShares)
      .multipliedBy(potBalance.data?.freeBalance ?? 1)
      .shiftedBy(-native.decimals)

    const referrerRewards = referrerShares
      .div(totalShares)
      .multipliedBy(potBalance.data?.freeBalance ?? 1)
      .shiftedBy(-native.decimals)

    return { isLoading, data: { totalRewards, referrerRewards } }
  }

  return { isLoading, data: undefined }
}

export const useClaimsMutation = () => {
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const queryClient = useQueryClient()
  const { account } = useAccount()

  return useMutation(
    async ({ value }: { value?: BN }) => {
      const toast = TOAST_MESSAGES.reduce((memo, type) => {
        const msType = type === "onError" ? "onLoading" : type
        memo[type] = (
          <>
            <Trans
              i18nKey={`referrals.toasts.claim.${msType}`}
              tOptions={{
                value,
              }}
            >
              <span />
            </Trans>
          </>
        )
        return memo
      }, {} as ToastMessage)

      return await createTransaction(
        { tx: api.tx.referrals.claimRewards() },
        { toast },
      )
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          QUERY_KEYS.accountReferralShares(account?.address),
        ),
    },
  )
}
