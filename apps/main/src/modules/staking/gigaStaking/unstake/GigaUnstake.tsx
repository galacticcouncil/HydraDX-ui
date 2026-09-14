import {
  Alert,
  Box,
  Button,
  Separator,
  Summary,
  SummaryRow,
} from "@galacticcouncil/ui/components"
import Big from "big.js"
import { FC } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  UserGigaBorrowSummary,
  useUserGigaBorrowSummary,
} from "@/api/borrow/queries"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { useGigaUnstake } from "@/modules/staking/gigaStaking/unstake/GigaUnstake.utils"
import { GigaUnstakeSkeleton } from "@/modules/staking/gigaStaking/unstake/GigaUnstakeSkeleton"
import { useAssets } from "@/providers/assetsProvider"

export type GigaUnstakeProps = {
  userBorrowSummary: UserGigaBorrowSummary
}

export const GigaUnstake = ({ loading }: { loading?: boolean }) => {
  const { data: gigaBorrowSummary } = useUserGigaBorrowSummary()

  if (loading || !gigaBorrowSummary) {
    return <GigaUnstakeSkeleton />
  }

  return <GigaUnstakeForm userBorrowSummary={gigaBorrowSummary} />
}

const GigaUnstakeForm: FC<GigaUnstakeProps> = ({ userBorrowSummary }) => {
  const { t } = useTranslation(["staking", "common"])
  const { native } = useAssets()
  const {
    form,
    onSubmit,
    maxUnstake,
    displayAmount,
    amountInHdx,
    frozenInGigaHdx,
    debtLockedInGigaHdx,
  } = useGigaUnstake({
    userBorrowSummary,
  })

  const hasLock = Big(frozenInGigaHdx).gt(0) || Big(debtLockedInGigaHdx).gt(0)
  const showFrozenLockAlert =
    hasLock && Big(frozenInGigaHdx).gte(Big(debtLockedInGigaHdx))

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Box px="l" asChild>
          <Box py="l" width="100%">
            <AssetSelectFormField
              assetFieldName="asset"
              amountFieldName="amount"
              label={t("gigaStaking.gigaUnstake.input.label")}
              assets={[]}
              disabledAssetSelector
              balance={{ value: maxUnstake, label: t("common:available") }}
              displayValue={t("common:currency", {
                value: displayAmount,
              })}
            />
          </Box>
        </Box>

        <Separator />

        <Summary px="l" separator={<Separator sx={{ mx: "-l" }} />}>
          <SummaryRow
            label={t("gigaStaking.gigaUnstake.receive.label")}
            content={t("common:currency", {
              prefix: "≈",
              value: amountInHdx,
              symbol: native.symbol,
            })}
          />
        </Summary>

        <Separator />

        {hasLock && (
          <>
            <Alert
              sx={{ m: "l" }}
              variant="warning"
              description={
                showFrozenLockAlert
                  ? t("gigaStaking.gigaUnstake.frozen.alert", {
                      value: frozenInGigaHdx,
                    })
                  : t("gigaStaking.gigaUnstake.debtLocked.alert", {
                      value: debtLockedInGigaHdx,
                    })
              }
            />

            <Separator />
          </>
        )}

        <Box p="l">
          <Button
            type="submit"
            size="large"
            width="100%"
            disabled={!form.formState.isValid}
          >
            {t("gigaStaking.gigaUnstake.cta")}
          </Button>
        </Box>
      </form>
    </FormProvider>
  )
}
