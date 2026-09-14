import {
  Box,
  Button,
  Flex,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { isSS58Address } from "@galacticcouncil/utils"
import { UseMutationResult } from "@tanstack/react-query"
import Big from "big.js"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { OmnipoolDepositFull, XykDeposit } from "@/api/account"
import { TAssetData } from "@/api/assets"
import { AssetLogo } from "@/components/AssetLogo"
import { ExpandableDynamicFee, FeeBreakdown } from "@/components/DynamicFee"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  TradeLimitRow,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import { isShareToken, TShareToken } from "@/providers/assetsProvider"
import { RemoveLiquidityType } from "@/routes/liquidity/$id.remove"
import { useAssetPrice } from "@/states/displayAsset"

import { ReceiveAssets, TReceiveAsset } from "./ReceiveAssets"
import {
  RemoveIsolatedPoolsLiquidity,
  RemoveSelectableXYKPositions,
} from "./RemoveIsolatedPoolLiquidity"
import { TRemoveLiquidityFormValues } from "./RemoveLiquidity.utils"
import { RemoveMoneyMarketLiquidity } from "./RemoveMoneyMarketLiquidity"
import {
  RemoveOmnipoolLiquidity,
  RemoveSelectablePositions,
} from "./RemoveOmnipoolLiquidity"
import { RemoveStablepoolLiquidity } from "./RemoveStablepoolLiquidity"

export type RemoveLiquidityProps = RemoveLiquidityType & {
  poolId: string
  onBack?: () => void
  closable?: boolean
  onSubmitted: () => void
}

export const RemoveLiquidity = (props: RemoveLiquidityProps) => {
  const isIsolatedPool = isSS58Address(props.poolId)

  if (props.selectable) {
    return isIsolatedPool ? (
      <RemoveSelectableXYKPositions {...props} />
    ) : (
      <RemoveSelectablePositions {...props} />
    )
  } else if (isIsolatedPool) {
    return <RemoveIsolatedPoolsLiquidity {...props} />
  } else if (props.positionId) {
    return <RemoveOmnipoolLiquidity {...props} />
  } else if (props.erc20Id && props.stableswapId) {
    return (
      <RemoveMoneyMarketLiquidity
        {...props}
        erc20Id={props.erc20Id}
        stableswapId={props.stableswapId}
      />
    )
  } else if (props.stableswapId) {
    return <RemoveStablepoolLiquidity {...props} />
  }

  return null
}

export const RemoveLiquidityForm = ({
  fee,
  receiveAssets,
  totalPositionShifted,
  editable,
  mutation,
  isIsolatedPool,
  meta,
  closable = false,
  onBack,
  deposits,
  feesBreakdown,
  displayValue,
  receiveNote,
}: RemoveLiquidityProps & {
  fee?: string
  totalPositionShifted: string
  receiveAssets: TReceiveAsset[]
  editable?: boolean
  mutation: UseMutationResult<void, Error, void>
  isIsolatedPool?: boolean
  meta: TAssetData | TShareToken
  deposits?: Array<XykDeposit | OmnipoolDepositFull>
  feesBreakdown?: FeeBreakdown[]
  displayValue?: string
  receiveNote?: string
}) => {
  const { t } = useTranslation(["liquidity", "common"])
  const {
    formState: { isValid },
    handleSubmit,
  } = useFormContext<TRemoveLiquidityFormValues>()

  const onSubmit = () => {
    mutation.mutate()
  }

  const { isValid: isValidPrice, price } = useAssetPrice(
    fee ? meta.id : undefined,
  )

  const feeDisplay =
    fee && isValidPrice
      ? Big(totalPositionShifted).times(fee).div(100).times(price).toString()
      : undefined

  return (
    <>
      <ModalHeader
        title={t("removeLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <ModalBody>
        <Flex direction="column" gap="l" asChild>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            {!editable ? (
              <Flex align="center" gap="base">
                <AssetLogo
                  id={isShareToken(meta) ? meta.iconId : meta.id}
                  size="large"
                />
                <Text
                  fs="h5"
                  fw={500}
                  color={getToken("text.high")}
                  font="primary"
                >
                  {t("common:currency", {
                    value: totalPositionShifted,
                    symbol: meta.symbol,
                  })}
                </Text>
              </Flex>
            ) : (
              <Box py={0} pb="l" width="100%">
                <AssetSelectFormField<TRemoveLiquidityFormValues>
                  assetFieldName="asset"
                  amountFieldName="amount"
                  balance={{ value: totalPositionShifted }}
                  displayValue={displayValue}
                  assets={[]}
                  disabledAssetSelector
                />
              </Box>
            )}

            <ModalContentDivider />

            <ReceiveAssets assets={receiveAssets} positions={deposits} />

            {receiveNote && (
              <Text fs="p6" color={getToken("text.low")}>
                {receiveNote}
              </Text>
            )}

            {!isIsolatedPool && (
              <div>
                <TradeLimitRow type={TradeLimitType.Liquidity} />

                <ModalContentDivider />

                {fee && feesBreakdown && (
                  <ExpandableDynamicFee
                    label={t("liquidity.remove.modal.withdrawalFees")}
                    rangeLow={0.34}
                    rangeHigh={0.66}
                    value={Number(fee)}
                    valueDisplay={feeDisplay}
                    range={[0.01, 0.34, 0.66, 1]}
                    feesBreakdown={feesBreakdown}
                  />
                )}
              </div>
            )}

            <ModalContentDivider />

            <Button type="submit" size="large" width="100%" disabled={!isValid}>
              {t("removeLiquidity")}
            </Button>
          </form>
        </Flex>
      </ModalBody>
    </>
  )
}
