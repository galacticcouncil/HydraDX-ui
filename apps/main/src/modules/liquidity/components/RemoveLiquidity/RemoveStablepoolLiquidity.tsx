import {
  Button,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  SummaryRow,
  Text,
  Toggle,
} from "@galacticcouncil/ui/components"
import { Flex } from "@galacticcouncil/ui/components/Flex"
import { getToken } from "@galacticcouncil/ui/utils"
import Big from "big.js"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAccountBalances } from "@/api/balances"
import { AssetLogo } from "@/components/AssetLogo"
import { TAssetWithBalance } from "@/components/AssetSelectModal/AssetSelectModal.utils"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { ReceiveAssets } from "@/modules/liquidity/components/RemoveLiquidity/ReceiveAssets"
import { RemoveLiquiditySkeleton } from "@/modules/liquidity/components/RemoveLiquidity/RemoveLiquiditySkeleton"
import {
  TradeLimitRow,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import {
  TStablepoolDetails,
  useStablepoolReserves,
} from "@/modules/liquidity/Liquidity.utils"
import { useAssetPrice } from "@/states/displayAsset"

import { RemoveLiquidityProps } from "./RemoveLiquidity"
import { useAssetsToRemoveFromStablepool } from "./RemoveLiquidity.utils"
import {
  TRemoveStablepoolLiquidityFormValues,
  useStablepoolRemoveLiquidity,
} from "./RemoveStablepoolLiquidity.utils"

export const RemoveStablepoolLiquidity = (props: RemoveLiquidityProps) => {
  const { data: stablepoolData } = useStablepoolReserves(
    props.stableswapId ?? props.poolId,
  )
  const { isBalanceLoading } = useAccountBalances()

  const receiveAssets = useAssetsToRemoveFromStablepool({
    reserves: stablepoolData?.reserves ?? [],
  })
  const initialReceiveAsset = receiveAssets[0]

  if (!stablepoolData || isBalanceLoading || !initialReceiveAsset)
    return <RemoveLiquiditySkeleton />

  return (
    <RemoveStablepoolLiquidityJSX
      pool={stablepoolData}
      initialReceiveAsset={initialReceiveAsset}
      receiveAssets={receiveAssets}
      {...props}
    />
  )
}

const RemoveStablepoolLiquidityJSX = ({
  pool,
  onBack,
  onSubmitted,
  closable,
  initialReceiveAsset,
  editable,
  receiveAssets,
}: RemoveLiquidityProps & {
  editable?: boolean
  pool: TStablepoolDetails
  initialReceiveAsset: TAssetWithBalance
  receiveAssets: TAssetWithBalance[]
}) => {
  const { t } = useTranslation(["liquidity", "common"])
  const { pool: poolData } = pool

  const {
    form,
    balance,
    receiveAssetsProportionally,
    fee,
    removeAmountShifted,
    onSubmit,
  } = useStablepoolRemoveLiquidity({
    ...pool,
    initialReceiveAsset,
    onSubmitted,
  })

  const {
    formState: { isValid },
    handleSubmit,
    watch,
  } = form

  const [asset, split] = watch(["asset", "split"])

  const { isValid: isValidPrice, price } = useAssetPrice(
    fee ? poolData.id.toString() : undefined,
  )

  const feeDisplay =
    fee && isValidPrice
      ? Big(removeAmountShifted).times(fee).div(100).times(price).toString()
      : undefined

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("removeLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <ModalBody>
        <Flex direction="column" gap="m" asChild>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            {editable ? (
              <Flex align="center" gap="base">
                <AssetLogo id={asset.iconId ?? asset.id} size="large" />
                <Text
                  fs="h5"
                  fw={500}
                  color={getToken("text.high")}
                  font="primary"
                >
                  {t("common:currency", {
                    value: balance,
                    symbol: asset.symbol,
                  })}
                </Text>
              </Flex>
            ) : (
              <AssetSelectFormField<TRemoveStablepoolLiquidityFormValues>
                assetFieldName="asset"
                amountFieldName="amount"
                label={t("common:amount")}
                assets={[]}
                disabledAssetSelector
              />
            )}

            <ModalContentDivider />

            <Controller
              control={form.control}
              name="split"
              render={({ field: { value, onChange } }) => (
                <Flex align="center" justify="space-between">
                  <Text fs="p3">
                    {t("liquidity.remove.stablepool.modal.proportionally")}
                  </Text>
                  <Toggle
                    size="large"
                    checked={value}
                    onCheckedChange={onChange}
                  />
                </Flex>
              )}
            />

            <ModalContentDivider />

            {!split ? (
              <AssetSelectFormField<TRemoveStablepoolLiquidityFormValues>
                label={t("common:minimumReceived")}
                assetFieldName="receiveAsset"
                amountFieldName="receiveAmount"
                assets={[]}
                sortedAssets={receiveAssets}
                balance={false}
                isReadOnly
              />
            ) : (
              <Flex direction="column" gap="s">
                <ReceiveAssets assets={receiveAssetsProportionally ?? []} />
              </Flex>
            )}

            <ModalContentDivider />

            <div>
              <TradeLimitRow type={TradeLimitType.Liquidity} />

              {!split && (
                <>
                  <ModalContentDivider />
                  <SummaryRow
                    label={t("liquidity.remove.modal.withdrawalFees")}
                    content={`${t("common:currency", { value: feeDisplay, maximumFractionDigits: null })} (${t("common:percent", { value: fee })})`}
                  />
                </>
              )}
            </div>

            <ModalContentDivider />

            <Button type="submit" size="large" width="100%" disabled={!isValid}>
              {t("removeLiquidity")}
            </Button>
          </form>
        </Flex>
      </ModalBody>
    </FormProvider>
  )
}
