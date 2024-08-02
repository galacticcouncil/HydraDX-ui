import { useMutation } from "@tanstack/react-query"
import { Farm } from "api/farms"
import { StepProps } from "components/Stepper/Stepper"
import { Trans, useTranslation } from "react-i18next"
import { ToastMessage, useStore } from "state/store"
import { useRpcProvider } from "providers/rpcProvider"
import { TOAST_MESSAGES } from "state/toasts"
import { scale } from "utils/balance"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { isEvmAccount } from "utils/evm"
import { useAssets } from "providers/assets"

export type FarmDepositMutationType = ReturnType<typeof useFarmDepositMutation>

export const useFarmDepositMutation = (
  poolId: string,
  positionId: string,
  farms: Farm[],
  onClose: () => void,
  onSuccess: () => void,
) => {
  const { createTransaction } = useStore()
  const { api } = useRpcProvider()
  const { t } = useTranslation()
  const { account } = useAccount()
  const { getAsset, isShareToken } = useAssets()
  const isEvm = isEvmAccount(account?.address)

  const meta = getAsset(poolId)
  const isXYK = isShareToken(meta)

  return useMutation(
    async ({ shares, value }: { shares: string; value: string }) => {
      const [firstFarm, ...restFarm] = farms ?? []

      if (firstFarm == null) throw new Error("Missing farm")
      if (!meta) throw new Error("Missing asset meta")

      const toast = TOAST_MESSAGES.reduce((memo, type) => {
        const msType = type === "onError" ? "onLoading" : type
        memo[type] = (
          <Trans
            t={t}
            i18nKey={`farms.modal.join.toast.${msType}`}
            tOptions={{
              amount: value,
              symbol: meta.symbol,
            }}
          >
            <span />
            <span className="highlight" />
          </Trans>
        )
        return memo
      }, {} as ToastMessage)

      const firstStep: StepProps[] = [
        {
          label: t("farms.modal.join.step", { number: 1 }),
          state: "active",
        },
        {
          label: t("farms.modal.join.step", { number: 2 }),
          state: "todo",
        },
      ]

      const firstDeposit = await createTransaction(
        {
          tx: isXYK
            ? api.tx.xykLiquidityMining.depositShares(
                firstFarm.globalFarm.id,
                firstFarm.yieldFarm.id,
                { assetIn: meta.assets[0], assetOut: meta.assets[1] },
                scale(shares, meta.decimals).toString(),
              )
            : api.tx.omnipoolLiquidityMining.depositShares(
                firstFarm.globalFarm.id,
                firstFarm.yieldFarm.id,
                positionId,
              ),
        },
        {
          toast,
          steps: restFarm.length ? firstStep : undefined,
          onSubmitted: onClose,
          onClose,
          onBack: () => {},
        },
      )

      const executeSecondMutation = async (depositId: string) => {
        const secondStep: StepProps[] = [
          {
            label: t("farms.modal.join.step", { number: 1 }),
            state: "done",
          },
          {
            label: t("farms.modal.join.step", { number: 2 }),
            state: "active",
          },
        ]

        const txs = restFarm.map((farm) =>
          isXYK
            ? api.tx.xykLiquidityMining.redepositShares(
                farm.globalFarm.id,
                farm.yieldFarm.id,
                { assetIn: meta.assets[0], assetOut: meta.assets[1] },
                depositId,
              )
            : api.tx.omnipoolLiquidityMining.redepositShares(
                farm.globalFarm.id,
                farm.yieldFarm.id,
                depositId,
              ),
        )

        if (txs.length > 0) {
          await createTransaction(
            {
              tx: txs.length > 1 ? api.tx.utility.batch(txs) : txs[0],
            },
            { toast, steps: secondStep },
          )
        }
      }

      if (isEvm) {
        const nftId = isXYK
          ? await api.consts.xykLiquidityMining.nftCollectionId
          : await api.consts.omnipoolLiquidityMining.nftCollectionId

        const positions = await api.query.uniques.account.entries(
          account?.address,
          nftId,
        )

        const depositId = positions
          .map((position) => position[0].args[2].toNumber())
          .sort((a, b) => b - a)[0]
          .toString()

        if (depositId) await executeSecondMutation(depositId)
      } else {
        for (const record of firstDeposit.events) {
          if (
            api.events.omnipoolLiquidityMining.SharesDeposited.is(
              record.event,
            ) ||
            api.events.xykLiquidityMining.SharesDeposited.is(record.event)
          ) {
            const depositId = record.event.data.depositId.toString()

            await executeSecondMutation(depositId)
          }
        }
      }
    },
    { onSuccess },
  )
}
