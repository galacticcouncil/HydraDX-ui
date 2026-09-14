import { Box, Button, Grid, Separator } from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { TAccountVote } from "@/api/democracy"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { useUnstake } from "@/modules/staking/Stake.unstake"
import { useAssets } from "@/providers/assetsProvider"

type Props = {
  readonly positionId: bigint
  readonly staked: string
  readonly votes: ReadonlyArray<TAccountVote>
  readonly votesSuccess: boolean
  readonly isLoading: boolean
  readonly onUnstake: () => void
}

export const UnstakeForm: FC<Props> = ({
  positionId,
  staked,
  votes,
  votesSuccess,
  isLoading,
  onUnstake,
}) => {
  const { t } = useTranslation(["common", "staking"])

  const { native } = useAssets()

  const unstakeMutation = useUnstake(positionId, votes, votesSuccess)

  const submitForm = () =>
    unstakeMutation.mutate(staked, {
      onSuccess: onUnstake,
    })

  return (
    <>
      <Box px="xl" py="l" width="100%">
        <AssetSelect
          label={t("staking:stake.unstake.amount")}
          assets={[]}
          selectedAsset={native}
          isDisabled
          value={staked}
          balance={false}
        />
      </Box>
      <Separator />
      {
        <Grid px="xl" py="xl">
          <AuthorizedAction size="large">
            <Button size="large" disabled={isLoading} onClick={submitForm}>
              {t("staking:stake.unstake.cta")}
            </Button>
          </AuthorizedAction>
        </Grid>
      }
    </>
  )
}
