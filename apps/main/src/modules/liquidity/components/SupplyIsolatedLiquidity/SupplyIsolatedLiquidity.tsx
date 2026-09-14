import {
  CollateralState,
  HealthFactorChange,
} from "@galacticcouncil/money-market/components"
import {
  ComputedUserReserveData,
  ExtendedFormattedUser,
} from "@galacticcouncil/money-market/hooks"
import {
  Alert,
  Box,
  Button,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Stack,
  SummaryRow,
} from "@galacticcouncil/ui/components"
import { getAddressFromAssetId } from "@galacticcouncil/utils"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData, TErc20AToken } from "@/api/assets"
import { useUserBorrowSummary } from "@/api/borrow/queries"
import {
  TAssetWithBalance,
  useAssetSelectModalAssets,
} from "@/components/AssetSelectModal/AssetSelectModal.utils"
import { TradeFee } from "@/components/TradeFee/TradeFee"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import { getApyLabel } from "@/modules/borrow/hooks/useApyBreakdownItems"
import {
  TSupplyIsolatedLiquidityFormValues,
  useSupplyIsolatedLiquidity,
} from "@/modules/liquidity/components/SupplyIsolatedLiquidity/SupplyIsolatedLiquidity.utils"
import { SupplyIsolatedLiquiditySkeleton } from "@/modules/liquidity/components/SupplyIsolatedLiquidity/SupplyIsolatedLiquiditySkeleton"
import {
  TradeLimit,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import { useAssets } from "@/providers/assetsProvider"
import { formatApyPercent } from "@/utils/formatApyPercent"

export const SupplyIsolatedLiquidity = ({
  assetId,
  onSubmitted,
}: {
  assetId: string
  onSubmitted: () => void
}) => {
  const { tradable, native, getRelatedAToken, isErc20AToken } = useAssets()
  const { data: userBorrowData } = useUserBorrowSummary()
  const relatedAToken = getRelatedAToken(assetId)

  const selectabledAssets = useAssetSelectModalAssets({
    assets: tradable,
    search: "",
    ignoreAssetIds: relatedAToken ? [relatedAToken.id] : undefined,
    highPriorityAssetIds: [assetId],
    lowPriorityAssetIds: [native.id],
  })
  const initialAsset = selectabledAssets.sortedAssets[0]

  const supplyAssetAddress = getAddressFromAssetId(assetId)

  const userReserve = userBorrowData?.userReservesData.find(
    (reserve) => reserve.underlyingAsset === supplyAssetAddress,
  )

  if (
    selectabledAssets.isLoading ||
    !initialAsset ||
    !relatedAToken ||
    !userBorrowData ||
    !userReserve
  )
    return <SupplyIsolatedLiquiditySkeleton />

  const aToken = isErc20AToken(relatedAToken) ? relatedAToken : undefined

  if (!aToken) throw new Error("A token is not found")

  return (
    <SupplyIsolatedLiquidityBody
      initialAsset={initialAsset}
      selectabledAssets={selectabledAssets.sortedAssets}
      assetId={assetId}
      aToken={aToken}
      userBorrowData={userBorrowData}
      userReserve={userReserve}
      onSubmitted={onSubmitted}
    />
  )
}

const SupplyIsolatedLiquidityBody = ({
  initialAsset,
  selectabledAssets,
  assetId,
  aToken,
  userBorrowData,
  userReserve,
  onSubmitted,
}: {
  initialAsset: TAssetData
  selectabledAssets: TAssetWithBalance[]
  assetId: string
  aToken: TErc20AToken
  userBorrowData: ExtendedFormattedUser
  userReserve: ComputedUserReserveData
  onSubmitted: () => void
}) => {
  const { t } = useTranslation(["common", "liquidity", "borrow", "trade"])
  const {
    form,
    maxBalance,
    onSubmit,
    collateralType,
    healthFactor,
    isBlockedByBorrowedAssets,
    isEnablingIsolatedModeWarning,
    isolationWarning,
    supplyCapWarning,
    debtCeilingWarning,
    isBlockedSupply,
    minReceiveAmountShifted,
    apys,
    spotPriceData,
    isPriceLoading,
    isTradeLoading,
    isAaveSupply,
    swap,
  } = useSupplyIsolatedLiquidity({
    initialAsset,
    supplyAssetId: assetId,
    aToken,
    userBorrowData,
    userReserve,
    onSubmitted,
  })

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("borrow:supply.withSymbol", {
          symbol: userReserve.reserve.symbol,
        })}
        closable
      />
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <ModalBody>
          <Box py={0} pb="l" width="100%">
            <AssetSelectFormField<TSupplyIsolatedLiquidityFormValues>
              label={t("amount")}
              assetFieldName="asset"
              amountFieldName="amount"
              sortedAssets={selectabledAssets}
              assets={[]}
              balance={{ value: maxBalance }}
            />
          </Box>

          <ModalContentDivider />

          <Stack gap="m" py="m" separated separator={<ModalContentDivider />}>
            {apys.map((apy, index) => (
              <SummaryRow
                key={index}
                label={getApyLabel(apy.apyType, true)}
                content={formatApyPercent(t, apy.apy)}
                sx={{ my: 0 }}
              />
            ))}
            {!isBlockedByBorrowedAssets && (
              <SummaryRow
                label={t("minimumReceived")}
                content={t("common:currency", {
                  value: minReceiveAmountShifted,
                  symbol: aToken.symbol,
                })}
                sx={{ my: 0 }}
              />
            )}

            <SummaryRow
              label={t("tradeLimit")}
              content={<TradeLimit type={TradeLimitType.Trade} />}
              sx={{ my: 0 }}
            />

            {swap && (
              <SummaryRow
                label={t("trade:market.summary.estTradeFees")}
                content={
                  <TradeFee
                    swap={swap}
                    receiveAsset={aToken}
                    isLoading={false}
                  />
                }
                sx={{ my: 0 }}
              />
            )}

            {!isAaveSupply && (
              <SummaryRow
                label={t("price")}
                content={
                  isPriceLoading ? (
                    <Skeleton width={50} height="100%" />
                  ) : (
                    t("liquidity:liquidity.remove.stablepool.modal.price", {
                      poolSymbol: form.watch("asset").symbol,
                      value: spotPriceData?.spotPrice,
                      symbol: aToken.symbol,
                    })
                  )
                }
                sx={{ my: 0 }}
              />
            )}

            {collateralType && (
              <SummaryRow
                label={t("borrow:collateral")}
                content={<CollateralState collateralType={collateralType} />}
                sx={{ my: 0 }}
              />
            )}
            {healthFactor && (
              <SummaryRow
                label={t("healthFactor")}
                content={<HealthFactorChange {...healthFactor} fontSize="p5" />}
                sx={{ my: 0 }}
              />
            )}
            {isolationWarning && (
              <Alert
                title={t("borrow:alert.enableIsolatedMode.title")}
                description={t("borrow:alert.enableIsolatedMode.desc", {
                  symbol: userReserve.reserve.symbol,
                })}
              />
            )}
            {supplyCapWarning}
            {debtCeilingWarning}
            {isBlockedByBorrowedAssets && (
              <Alert
                variant="warning"
                description={t("borrow:alert.borrowIsolated", {
                  symbol: userReserve.reserve.symbol,
                })}
              />
            )}
            {isEnablingIsolatedModeWarning && (
              <Alert
                variant="warning"
                description={t("borrow:alert.supplyIsolated", {
                  symbol: userReserve.reserve.symbol,
                })}
              />
            )}
          </Stack>

          <ModalContentDivider />
        </ModalBody>
        <ModalFooter sx={{ pt: 0 }}>
          <Button
            type="submit"
            size="large"
            width="100%"
            disabled={
              isBlockedSupply || !form.formState.isValid || isTradeLoading
            }
          >
            {t("borrow:supply.withSymbol", {
              symbol: userReserve.reserve.symbol,
            })}
          </Button>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}
