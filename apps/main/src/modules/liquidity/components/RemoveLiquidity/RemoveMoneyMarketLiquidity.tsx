import {
  HealthFactorChange,
  HealthFactorRiskWarning,
} from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import {
  Button,
  Flex,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Skeleton,
  Summary,
  SummaryRow,
  Text,
  Toggle,
} from "@galacticcouncil/ui/components"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import { spotPriceQuery } from "@/api/spotPrice"
import { Trade } from "@/api/trade"
import { TSelectedAsset } from "@/components/AssetSelect/AssetSelect"
import { TAssetWithBalance } from "@/components/AssetSelectModal/AssetSelectModal.utils"
import { TradeFee } from "@/components/TradeFee/TradeFee"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  TradeLimitRow,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import {
  TStablepoolDetails,
  useStablepoolReserves,
} from "@/modules/liquidity/Liquidity.utils"
import { useRpcProvider } from "@/providers/rpcProvider"

import { ReceiveAssets } from "./ReceiveAssets"
import { RemoveLiquidityProps } from "./RemoveLiquidity"
import { useAssetsToRemoveFromMoneyMarket } from "./RemoveLiquidity.utils"
import { RemoveLiquiditySkeleton } from "./RemoveLiquiditySkeleton"
import { useRemoveMoneyMarketLiquidity } from "./RemoveMoneyMarketLiquidity.utils"
import { TRemoveStablepoolLiquidityFormValues } from "./RemoveStablepoolLiquidity.utils"

export type TRemoveMoneyMarketLiquidityProps = RemoveLiquidityProps & {
  erc20Id: string
  stableswapId: string
  title?: string
}

export const RemoveMoneyMarketLiquidity = (
  props: TRemoveMoneyMarketLiquidityProps,
) => {
  const { data: stablepolData } = useStablepoolReserves(props.stableswapId)
  const { isBalanceLoading } = useAccountBalances()

  const receiveAssets = useAssetsToRemoveFromMoneyMarket({
    stableswapId: props.stableswapId,
    reserves: stablepolData?.reserves ?? [],
    options: { blacklist: [props.erc20Id, props.stableswapId] },
  })

  const initialReceiveAsset = receiveAssets[0]

  if (!stablepolData || !initialReceiveAsset || isBalanceLoading)
    return <RemoveLiquiditySkeleton />

  return (
    <RemoveMoneyMarketLiquidityForm
      {...props}
      initialReceiveAsset={initialReceiveAsset}
      receiveAssets={receiveAssets}
      pool={stablepolData}
    />
  )
}

const RemoveMoneyMarketLiquidityForm = (
  props: TRemoveMoneyMarketLiquidityProps & {
    initialReceiveAsset: TAssetWithBalance
    receiveAssets: TAssetWithBalance[]
    pool: TStablepoolDetails
  },
) => {
  const { t } = useTranslation(["liquidity", "common"])
  const {
    form,
    maxBalanceWithFee,
    receiveAssetsProportionally,
    meta,
    tradeMinReceive,
    swap,
    isTradePending,
    mutation,
    healthFactor,
    isLoadingMaxBalance,
  } = useRemoveMoneyMarketLiquidity({ ...props, ...props.pool })
  const { closable, onBack, receiveAssets, title } = props

  const {
    formState: { isValid },
    handleSubmit,
    watch,
  } = form

  const [receiveAsset, split] = watch(["receiveAsset", "split"])

  const [healthFactorRiskAccepted, setHealthFactorRiskAccepted] =
    useState(false)

  useEffect(() => {
    const subscription = watch((_, args) => {
      if (args.type !== "change") return

      setHealthFactorRiskAccepted(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch])

  const isHealthFactorCheckSatisfied = healthFactor?.isUserConsentRequired
    ? healthFactorRiskAccepted
    : true

  const onSubmit = () => {
    mutation.mutate()
  }

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={title ?? t("removeLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <ModalBody>
        <Flex direction="column" gap="m" asChild>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <AssetSelectFormField<TRemoveStablepoolLiquidityFormValues>
              assetFieldName="asset"
              amountFieldName="amount"
              label={t("common:amount")}
              balance={{
                value: maxBalanceWithFee,
                isLoading: isLoadingMaxBalance,
              }}
              assets={[]}
              disabledAssetSelector
            />

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
                label={t("common:get")}
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

            {split ? (
              <div>
                <TradeLimitRow type={TradeLimitType.Liquidity} />
                {healthFactor ? (
                  <>
                    <ModalContentDivider />
                    <SummaryRow
                      label={t("common:healthFactor")}
                      content={<HealthFactorChange {...healthFactor} />}
                    />
                  </>
                ) : null}
              </div>
            ) : (
              <TradeSummary
                receiveAsset={receiveAsset}
                minReceive={tradeMinReceive}
                erc20={meta}
                healthFactor={healthFactor}
                swap={swap}
                isTradePending={isTradePending}
              />
            )}

            {healthFactor?.isUserConsentRequired && (
              <HealthFactorRiskWarning
                message={t("common:healthFactor.warning")}
                accepted={healthFactorRiskAccepted}
                onAcceptedChange={setHealthFactorRiskAccepted}
                isUserConsentRequired={healthFactor.isUserConsentRequired}
              />
            )}

            <ModalContentDivider />

            <Button
              type="submit"
              size="large"
              width="100%"
              disabled={
                !isValid || !isHealthFactorCheckSatisfied || isLoadingMaxBalance
              }
            >
              {title ?? t("removeLiquidity")}
            </Button>
          </form>
        </Flex>
      </ModalBody>
    </FormProvider>
  )
}

const TradeSummary = ({
  receiveAsset,
  minReceive,
  erc20,
  healthFactor,
  swap,
  isTradePending,
}: {
  receiveAsset: TSelectedAsset
  minReceive: string
  erc20: TAssetData
  healthFactor: HealthFactorResult | undefined
  swap?: Trade
  isTradePending: boolean
}) => {
  const { t } = useTranslation(["common", "trade"])
  const rpc = useRpcProvider()

  const { data: spotPriceData, isPending: isSpotPricePending } = useQuery(
    spotPriceQuery(rpc, receiveAsset.id, erc20.id),
  )

  return (
    <div>
      <TradeLimitRow type={TradeLimitType.Trade} />

      <ModalContentDivider />
      <SummaryRow
        label={t("trade:market.summary.estTradeFees")}
        content={
          <TradeFee
            swap={swap}
            receiveAsset={receiveAsset}
            isLoading={isTradePending}
          />
        }
      />

      <ModalContentDivider />
      <Summary
        separator={<ModalContentDivider />}
        rows={[
          {
            label: t("minimumReceived"),
            content: t("currency", {
              value: minReceive,
              symbol: receiveAsset.symbol,
            }),
          },
          {
            label: t("price"),
            content: isSpotPricePending ? (
              <Skeleton width={100} sx={{ height: 18 }} />
            ) : (
              `${t("currency", { value: 1, symbol: receiveAsset.symbol })}≈${t("currency", { value: spotPriceData?.spotPrice, symbol: erc20.symbol })}`
            ),
          },
          ...(healthFactor
            ? [
                {
                  label: t("healthFactor"),
                  content: <HealthFactorChange {...healthFactor} />,
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
