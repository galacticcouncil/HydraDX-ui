import { calculate_liquidity_in } from "@galacticcouncil/math-xyk"
import { Alert, Button, Summary } from "@galacticcouncil/ui/components"
import {
  ModalBody,
  ModalContentDivider,
  ModalFooter,
} from "@galacticcouncil/ui/components/Modal"
import { ModalHeader } from "@galacticcouncil/ui/components/Modal"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Farm } from "@/api/farms"
import {
  TXYKConsts,
  useXYKConsts,
  useXYKPoolWithLiquidity,
  XYKPoolWithLiquidity,
} from "@/api/xyk"
import { AssetSwitcher } from "@/components/AssetSwitcher/AssetSwitcher"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { RewardsAPR } from "@/modules/liquidity/components/AddLiquidity/RewardsAPR"
import { calculatePoolFee } from "@/modules/liquidity/Liquidity.utils"
import { TShareToken, XYKPoolMeta } from "@/providers/assetsProvider"
import { useAssets } from "@/providers/assetsProvider"
import { AddLiquidityProps } from "@/routes/liquidity/$id.add"
import { scale } from "@/utils/formatting"
import { scaleHuman } from "@/utils/formatting"

import {
  orders,
  TAddIsolatedLiquidityFormValues,
  useAddIsolatedLiquidity,
} from "./AddIsolatedLiquidity.utils"
import { AddIsolatedLiquiditySkeleton } from "./AddIsolatedLiquiditySkeleton"

export const AddIsolatedLiquidity = (props: AddLiquidityProps) => {
  const { data: consts } = useXYKConsts()
  const { getShareTokenByAddress } = useAssets()
  const { data: pool, isLoading } = useXYKPoolWithLiquidity(props.id)

  const shareTokenMeta = getShareTokenByAddress(pool?.address ?? "")

  return isLoading || !pool || !consts || !shareTokenMeta ? (
    <AddIsolatedLiquiditySkeleton {...props} />
  ) : (
    <AddIsolatedLiquidityForm
      pool={pool}
      consts={consts}
      shareTokenMeta={shareTokenMeta}
      {...props}
    />
  )
}

export const AddIsolatedLiquidityForm = ({
  pool,
  consts,
  onBack,
  closable = false,
  onSubmitted,
  shareTokenMeta,
}: AddLiquidityProps & {
  pool: XYKPoolWithLiquidity
  consts: TXYKConsts
  shareTokenMeta: TShareToken
}) => {
  const { t } = useTranslation(["liquidity", "common"])

  const {
    form,
    getMaxBalance,
    reserveA,
    reserveB,
    ratio,
    mutation,
    assetAMeta,
    assetBMeta,
    shares,
    getShares,
    price,
    isPriceLoading,
    activeFarms,
    joinFarmErrorMessage,
    isJoinFarms,
  } = useAddIsolatedLiquidity({ pool, consts, onSubmitted, shareTokenMeta })

  const onSubmit = async () => {
    const values = form.getValues()
    const mainAsset = values.lastUpdated
    const secondaryAsset = orders.find((order) => order !== mainAsset)!

    const assetsMap = {
      assetA: {
        asset: values.assetA,
        amount: values.amountA,
      },
      assetB: {
        asset: values.assetB,
        amount: values.amountB,
      },
    }

    mutation.mutate({
      assetA: assetsMap[mainAsset].asset,
      assetB: assetsMap[secondaryAsset].asset,
      amountA: assetsMap[mainAsset].amount,
      amountB: assetsMap[secondaryAsset].amount,
    })
  }

  const sharesError = form.formState.errors.shares

  return (
    <>
      <ModalHeader
        title={t("addLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <FormProvider {...form}>
        <form autoComplete="off" onSubmit={form.handleSubmit(onSubmit)}>
          <ModalBody>
            <AssetSelectFormField<TAddIsolatedLiquidityFormValues>
              label={t("liquidity.createPool.modal.assetA")}
              assetFieldName="assetA"
              amountFieldName="amountA"
              assets={[]}
              maxBalance={getMaxBalance(assetAMeta)}
              disabledAssetSelector
              onAmountChange={(value) => {
                form.setValue("lastUpdated", "assetA")

                const amountB = scaleHuman(
                  calculate_liquidity_in(
                    reserveA,
                    reserveB,
                    scale(value, assetAMeta.decimals),
                  ),
                  assetBMeta.decimals,
                )

                form.setValue("amountB", amountB, {
                  shouldValidate: true,
                  shouldTouch: true,
                })

                form.setValue("shares", getShares(value), {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }}
              sx={{ pt: 0 }}
            />

            <AssetSwitcher
              assetInId={assetAMeta.id}
              assetOutId={assetBMeta.id}
              fallbackPrice={price}
              isFallbackPriceLoading={isPriceLoading}
            />

            <AssetSelectFormField<TAddIsolatedLiquidityFormValues>
              label={t("liquidity.createPool.modal.assetB")}
              assetFieldName="assetB"
              amountFieldName="amountB"
              assets={[]}
              maxBalance={getMaxBalance(assetBMeta)}
              disabledAssetSelector
              onAmountChange={(value) => {
                form.setValue("lastUpdated", "assetB")

                const amountA = scaleHuman(
                  calculate_liquidity_in(
                    reserveB,
                    reserveA,
                    scale(value, assetBMeta.decimals),
                  ),
                  assetAMeta.decimals,
                )

                form.setValue("shares", getShares(amountA), {
                  shouldValidate: true,
                  shouldTouch: true,
                })

                form.setValue("amountA", amountA, {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }}
            />

            <ModalContentDivider />

            <AddLiquiditySummary
              meta={shareTokenMeta}
              poolShare={ratio ?? "0"}
              sharesToGet={shares ?? "0"}
              farms={activeFarms}
              consts={consts}
            />

            {sharesError && (
              <Alert
                variant="error"
                description={sharesError.message}
                sx={{ mb: "l" }}
              />
            )}

            {joinFarmErrorMessage && (
              <Alert
                variant="warning"
                description={joinFarmErrorMessage}
                sx={{ my: "xxl" }}
              />
            )}

            <ModalContentDivider />
          </ModalBody>
          <ModalFooter sx={{ pt: 0 }}>
            <Button
              type="submit"
              size="large"
              width="100%"
              disabled={!form.formState.isValid}
            >
              {isJoinFarms
                ? t("liquidity.add.modal.submitAndjoinFarms")
                : t("liquidity.add.modal.submit")}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </>
  )
}

const AddLiquiditySummary = ({
  meta,
  poolShare,
  sharesToGet,
  farms,
  consts,
  isLoading,
}: {
  meta: XYKPoolMeta
  poolShare: string
  sharesToGet: string
  farms: Farm[]
  consts: TXYKConsts
  isLoading?: boolean
}) => {
  const { t } = useTranslation(["liquidity", "common"])

  const tradeFee = calculatePoolFee(consts.fee)

  return (
    <Summary
      separator={<ModalContentDivider />}
      rows={[
        {
          label: t("liquidity.add.modal.sharesToGet.label"),
          content: t("liquidity.add.modal.sharesToGet", {
            value: scaleHuman(sharesToGet, meta.decimals),
            percentage: poolShare,
          }),
          loading: isLoading,
        },
        {
          label: t("common:yield"),
          content: <RewardsAPR farms={farms} fee={tradeFee} />,
          loading: isLoading,
        },
      ]}
    />
  )
}
