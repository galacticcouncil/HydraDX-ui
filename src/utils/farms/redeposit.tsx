import { useMutation } from "@tanstack/react-query"
import { Farm } from "api/farms"
import { ToastMessage, useStore } from "state/store"
import { useRpcProvider } from "providers/rpcProvider"
import { TOAST_MESSAGES } from "state/toasts"
import { Trans, useTranslation } from "react-i18next"
import { useAssets } from "providers/assets"
import { TDeposit } from "api/deposits"

export type FarmRedepositMutationType = ReturnType<
  typeof useFarmRedepositMutation
>

export const useFarmRedepositMutation = (
  availableYieldFarms: Farm[] | undefined,
  depositNft: TDeposit,
  poolId: string,
  onClose?: () => void,
) => {
  const { t } = useTranslation()
  const { api } = useRpcProvider()
  const { getAssetWithFallback, isShareToken } = useAssets()
  const { createTransaction } = useStore()

  return useMutation(
    async ({ shares, value }: { shares: string; value: string }) => {
      if (!availableYieldFarms?.length)
        throw new Error("No available farms to redeposit into")
      const meta = getAssetWithFallback(poolId)

      const toast = TOAST_MESSAGES.reduce((memo, type) => {
        const msType = type === "onError" ? "onLoading" : type
        memo[type] = (
          <Trans
            t={t}
            i18nKey={`farms.modal.join.toast.${msType}`}
            tOptions={{
              amount: value,
              symbol: meta.isShareToken ? "share tokens" : meta.symbol,
            }}
          >
            <span />
            <span className="highlight" />
          </Trans>
        )
        return memo
      }, {} as ToastMessage)

      const isXYK = isShareToken(meta)

      const txs = availableYieldFarms
        .map((farm) => {
          return isXYK
            ? api.tx.xykLiquidityMining.redepositShares(
                farm.globalFarm.id,
                farm.yieldFarm.id,
                { assetIn: meta.assets[0], assetOut: meta.assets[1] },
                depositNft.id,
              )
            : api.tx.omnipoolLiquidityMining.redepositShares(
                farm.globalFarm.id,
                farm.yieldFarm.id,
                depositNft.id,
              )
        })
        .flat(2)

      if (txs.length > 1) {
        await createTransaction(
          { tx: api.tx.utility.batchAll(txs) },
          { toast, onSubmitted: onClose, onBack: () => {}, onClose },
        )
      } else {
        await createTransaction({ tx: txs[0] }, { toast, onSubmitted: onClose })
      }
    },
  )
}
