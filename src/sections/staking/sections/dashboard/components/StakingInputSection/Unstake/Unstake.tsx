import { GradientText } from "components/Typography/GradientText/GradientText"
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { ToastMessage, useStore } from "state/store"
import BigNumber from "bignumber.js"
import { Button } from "components/Button/Button"
import { Web3ConnectModalButton } from "sections/web3-connect/modal/Web3ConnectModalButton"
import { Text } from "components/Typography/Text/Text"
import { AssetSelectSkeleton } from "components/AssetSelect/AssetSelectSkeleton"
import { UnstakeAssetSelect } from "./UnstakeAssetSelect"
import { Spacer } from "components/Spacer/Spacer"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { TOAST_MESSAGES } from "state/toasts"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { usePositionVotesIds, useProcessedVotesIds } from "api/staking"
import { useAssets } from "providers/assets"

export const Unstake = ({
  loading,
  staked,
  positionId,
}: {
  loading: boolean
  positionId?: number
  staked: BigNumber
}) => {
  const { t } = useTranslation()
  const { native } = useAssets()
  const queryClient = useQueryClient()
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()

  const { account } = useAccount()
  const form = useForm<{ amount: string }>({
    values: {
      amount: staked.toString(),
    },
  })

  const processedVotes = useProcessedVotesIds()
  const positionVotes = usePositionVotesIds()

  const onSubmit = async () => {
    if (!positionId) return null

    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`staking.toasts.unstake.${msType}`}
          tOptions={{
            value: staked,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    const pendingVoteIds = await positionVotes.mutateAsync(positionId)
    const processedVoteIds = await processedVotes.mutateAsync()

    const voteIds = [...pendingVoteIds, ...processedVoteIds]

    const transaction = await createTransaction(
      {
        tx: voteIds.length
          ? api.tx.utility.batchAll([
              ...voteIds.map((id) => api.tx.democracy.removeVote(id)),
              api.tx.staking.unstake(positionId),
            ])
          : api.tx.staking.unstake(positionId),
      },
      { toast },
    )

    await queryClient.invalidateQueries(QUERY_KEYS.stake(account?.address))
    await queryClient.invalidateQueries(QUERY_KEYS.circulatingSupply)
    await queryClient.invalidateQueries(
      QUERY_KEYS.tokenBalance(native.id, account?.address),
    )

    if (!transaction.isError) {
      form.reset({ amount: "0" })
    }
  }

  return (
    <div sx={{ flex: "column" }}>
      <GradientText
        gradient="pinkLightBlue"
        fs={19}
        sx={{ width: "fit-content", py: 16 }}
      >
        {t("staking.dashboard.form.unstake.title")}
      </GradientText>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        autoComplete="off"
        sx={{
          flex: "column",
          justify: "space-between",
          minHeight: "100%",
        }}
      >
        <Controller
          name="amount"
          control={form.control}
          rules={{
            required: t("wallet.assets.transfer.error.required"),
            validate: {
              validNumber: (value) => {
                try {
                  if (!new BigNumber(value).isNaN()) return true
                } catch {}
                return t("error.validNumber")
              },
              positive: (value) =>
                new BigNumber(value).gt(0) || t("error.positive"),
            },
          }}
          render={({
            field: { name, value, onChange },
            fieldState: { error },
          }) =>
            loading ? (
              <AssetSelectSkeleton
                title={t("staking.dashboard.form.stake.inputTitle")}
                name={name}
                balanceLabel={t("staking.dashboard.form.unstake.balanceLabel")}
              />
            ) : (
              <UnstakeAssetSelect
                title={t("staking.dashboard.form.stake.inputTitle")}
                name={name}
                value={value}
                onChange={onChange}
                assetId={native.id}
                error={error?.message}
              />
            )
          }
        />

        <Spacer size={20} />

        {account ? (
          <Button
            variant="blue"
            type="submit"
            disabled={loading || staked.isZero()}
          >
            {t("staking.dashboard.form.unstake.button")}
          </Button>
        ) : (
          <Web3ConnectModalButton />
        )}

        <Text color="brightBlue200Alpha" fs={14} sx={{ p: 10 }}>
          {t("staking.dashboard.form.unstake.msg")}
        </Text>
      </form>
    </div>
  )
}
