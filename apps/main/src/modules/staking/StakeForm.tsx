import {
  Alert,
  Box,
  Button,
  Grid,
  Separator,
  Summary,
  SummaryRow,
  SummaryRowLabel,
  SummaryRowValue,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDebounce } from "react-use"

import { TAccountVote } from "@/api/democracy"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { useStake } from "@/modules/staking/Stake.form"
import { useIncreaseStake } from "@/modules/staking/Stake.utils"
import { useAssets } from "@/providers/assetsProvider"
import { toBigInt } from "@/utils/formatting"

type Props = {
  readonly positionId: bigint
  readonly staked: string | undefined
  readonly votes: ReadonlyArray<TAccountVote>
  readonly votesSuccess: boolean
  readonly balance: string
  readonly isLoading: boolean
}

export const StakeForm: FC<Props> = ({
  positionId,
  staked,
  votes,
  votesSuccess,
  balance,
  isLoading,
}) => {
  const { t } = useTranslation(["common", "staking"])

  const { native } = useAssets()
  const { form, minStake, maxBalanceHuman, mutation, hasGigaStakes } = useStake(
    balance,
    staked || "0",
    positionId,
    votes,
    votesSuccess,
  )

  const submitForm = form.handleSubmit((values) =>
    mutation.mutate(values.amount),
  )

  const amount = form.watch("amount")
  const { diffDays, update } = useIncreaseStake()

  useDebounce(
    () => {
      update(
        staked ? "value" : "stakeValue",
        amount ? toBigInt(amount, native.decimals) : undefined,
      )
    },
    500,
    [amount, staked],
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={submitForm}>
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <Box px="xl" py="l" width="100%">
              <AssetSelect
                label={t("staking:stake.stake.amount")}
                assets={[]}
                selectedAsset={native}
                balance={{ value: maxBalanceHuman }}
                value={field.value}
                onChange={field.onChange}
                amountError={fieldState.error?.message}
              />
            </Box>
          )}
        />
        <Separator />
        <Summary px="xl" separator={<Separator mx="-xl" />}>
          <SummaryRow
            label={t("staking:stake.stake.minimum")}
            content={t("currency", {
              value: minStake,
              symbol: native.symbol,
            })}
          />
          {diffDays && diffDays !== "0" && (
            <SummaryRow
              label={
                <SummaryRowLabel color={getToken("colors.azureBlue.400")}>
                  {t("staking:stake.stake.increasedBy")}
                </SummaryRowLabel>
              }
              content={
                <SummaryRowValue color={getToken("colors.azureBlue.400")}>
                  ≈{" "}
                  {t("day", {
                    count: +diffDays,
                  })}
                </SummaryRowValue>
              }
            />
          )}
        </Summary>

        <Separator />

        {hasGigaStakes && (
          <>
            <Box m="xl" asChild>
              <Alert
                variant="warning"
                title={t("staking:gigaStaking.stake.gigaStakes")}
              />
            </Box>
            <Separator />
          </>
        )}

        <Grid px="xl" py="xl">
          <AuthorizedAction size="large">
            <Button
              type="submit"
              size="large"
              disabled={
                isLoading ||
                form.formState.isSubmitting ||
                !form.formState.isValid ||
                hasGigaStakes
              }
            >
              {t("staking:stake.stake.cta")}
            </Button>
          </AuthorizedAction>
        </Grid>
      </form>
    </FormProvider>
  )
}
