import { HealthFactorChange } from "@galacticcouncil/money-market/components"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import {
  Alert,
  Box,
  Button,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Summary,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { FC } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { BorrowAssetApyData } from "@/api/borrow"
import { Farm } from "@/api/farms"
import { Trade } from "@/api/trade"
import { TradeFee } from "@/components/TradeFee/TradeFee"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { AddLiquidityYield } from "@/modules/liquidity/components/AddLiquidity/AddLiquidityYield"
import {
  TradeLimit,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import { useAssets } from "@/providers/assetsProvider"
import { AddLiquidityProps } from "@/routes/liquidity/$id.add"
import { useAssetPrice } from "@/states/displayAsset"
import { scaleHuman } from "@/utils/formatting"

import {
  getCustomErrors,
  TAddLiquidityFormValues,
  useAddLiquidity,
} from "./AddLiqudity.utils"

export const AddLiquidity: FC<AddLiquidityProps> = ({
  id,
  onBack,
  closable = false,
  onSubmitted,
}) => {
  const { t } = useTranslation(["liquidity", "common"])

  const {
    form,
    getMaxBalance,
    liquidityShares,
    poolMeta,
    activeFarms,
    joinFarmErrorMessage,
    onSubmit,
    isJoinFarms,
    canAddLiquidity,
    underlyingAssetMeta,
    healthFactor,
  } = useAddLiquidity({ poolId: id, onSubmitted })

  const { formState, handleSubmit, watch } = form
  const customErrors = getCustomErrors(formState.errors.amount)

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("addLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <ModalBody>
          <Box py={0} pb="l" width="100%">
            <AssetSelectFormField<TAddLiquidityFormValues>
              label={t("liquidity.add.modal.selectAsset")}
              assetFieldName="asset"
              amountFieldName="amount"
              assets={
                underlyingAssetMeta ? [underlyingAssetMeta, poolMeta] : []
              }
              balance={{ value: getMaxBalance(watch("asset")) }}
              disabledAssetSelector={!underlyingAssetMeta}
            />
          </Box>

          <ModalContentDivider />

          <AddLiquiditySummary
            meta={poolMeta}
            poolShare={liquidityShares?.poolShare ?? "0"}
            minReceiveAmount={scaleHuman(
              liquidityShares?.minSharesToGet ?? "0",
              poolMeta.decimals,
            )}
            farms={joinFarmErrorMessage ? [] : activeFarms}
            healthFactor={healthFactor}
          />

          {customErrors?.cap ? (
            <Alert
              variant="warning"
              description={customErrors.cap.message}
              sx={{ my: "xxl" }}
            />
          ) : null}
          {customErrors?.circuitBreaker ? (
            <Alert
              variant="warning"
              description={customErrors.circuitBreaker.message}
              sx={{ my: "xxl" }}
            />
          ) : null}
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
            disabled={!canAddLiquidity || !formState.isValid}
          >
            {isJoinFarms
              ? t("liquidity.add.modal.submitAndjoinFarms")
              : t("liquidity.add.modal.submit")}
          </Button>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}

export const AddLiquiditySummary = ({
  meta,
  poolShare,
  minReceiveAmount,
  farms,
  healthFactor,
  stablepoolId,
  borrowApyData,
  swap,
}: {
  meta: TAssetData
  poolShare?: string
  minReceiveAmount: string
  farms: Farm[]
  stablepoolId?: string
  healthFactor?: HealthFactorResult
  borrowApyData?: BorrowAssetApyData
  swap?: Trade
}) => {
  const { t } = useTranslation(["liquidity", "common", "trade"])
  const { native } = useAssets()
  const { isMobile } = useBreakpoints()

  const { price, isLoading: isPriceLoading } = useAssetPrice(meta.id)

  return (
    <Summary
      separator={<ModalContentDivider />}
      rows={[
        {
          label: isMobile
            ? t("liquidity.add.modal.sharesToGet.label.mob")
            : t("liquidity.add.modal.sharesToGet.label"),
          content: poolShare
            ? t("liquidity.add.modal.sharesToGet", {
                percentage: poolShare,
              })
            : t("common:number", {
                value: minReceiveAmount,
              }),
        },
        {
          label: t("common:tradeLimit"),
          content: <TradeLimit type={TradeLimitType.Liquidity} />,
        },
        ...(swap
          ? [
              {
                label: t("trade:market.summary.estTradeFees"),
                content: (
                  <TradeFee swap={swap} receiveAsset={meta} isLoading={false} />
                ),
              },
            ]
          : []),
        {
          label: t("common:yield"),
          content:
            meta.id === native.id ? (
              "--"
            ) : (
              <AddLiquidityYield
                omnipoolId={meta.id}
                stablepoolId={stablepoolId}
                farms={farms}
                borrowApyData={borrowApyData}
              />
            ),
        },
        {
          label: t("common:price"),
          content: isPriceLoading ? (
            <Skeleton width={50} height="100%" />
          ) : (
            t("liquidity.add.modal.price", {
              value: price,
              assetSymbol: meta.symbol,
            })
          ),
        },
        ...(healthFactor
          ? [
              {
                label: t("common:healthFactor"),
                content: <HealthFactorChange {...healthFactor} fontSize="p5" />,
              },
            ]
          : []),
      ]}
    />
  )
}
