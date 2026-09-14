import { Separator, Stack, SummaryRow } from "@galacticcouncil/ui/components"
import { getAssetIdFromAddress } from "@galacticcouncil/utils"
import Big from "big.js"
import { useRef, useState } from "react"

import { AssetInput, HealthFactorChange } from "@/components/primitives"
import { HealthFactorRiskWarning } from "@/components/primitives/HealthFactorRiskWarning"
import { ValueDetail } from "@/components/primitives/ValueDetail"
import { TxModalWrapperRenderProps } from "@/components/transactions/TxModalWrapper"
import { useAppDataContext } from "@/hooks/app-data-provider/useAppDataProvider"
import { useAppFormatters } from "@/hooks/app-data-provider/useAppFormatters"
import { useModalContext } from "@/hooks/useModal"
import { useWithdrawEstimationTx } from "@/hooks/useWithdrawEstimationTx"
import { useSharedDependencies } from "@/ui-config/SharedDependenciesProvider"
import { calculateMaxWithdrawAmount, formatHealthFactorResult } from "@/utils"
import { calculateHFAfterWithdraw } from "@/utils/hfUtils"
import { zeroLTVBlockingWithdraw } from "@/utils/transactions"

import { WithdrawActions } from "./WithdrawActions"
import { useWithdrawError } from "./WithdrawError"

export enum ErrorType {
  CAN_NOT_WITHDRAW_THIS_AMOUNT,
  POOL_DOES_NOT_HAVE_ENOUGH_LIQUIDITY,
  ZERO_LTV_WITHDRAW_BLOCKED,
}

export const WithdrawModalContent: React.FC<TxModalWrapperRenderProps> = ({
  poolReserve,
  userReserve,
  symbol,
}) => {
  const { formatCurrency } = useAppFormatters()
  const { mainTxState: withdrawTxState } = useModalContext()
  const { user } = useAppDataContext()

  const [_amount, setAmount] = useState("")
  const [withdrawMax, setWithdrawMax] = useState("")
  const [
    healthFactorRiskCheckboxAccepted,
    setHealthFactorRiskCheckboxAccepted,
  ] = useState(false)
  const amountRef = useRef<string>("")
  const maxAmountToWithdraw = calculateMaxWithdrawAmount(
    user,
    userReserve,
    poolReserve,
  )

  const { useMaxBalance, getRelatedATokenId } = useSharedDependencies()

  const withdrawAssetId = getAssetIdFromAddress(poolReserve.underlyingAsset)
  const relatedATokenId = getRelatedATokenId(withdrawAssetId)

  const { data: withdrawEstimationTx } = useWithdrawEstimationTx({
    poolAddress: poolReserve.underlyingAsset,
    aTokenAddress: poolReserve.aTokenAddress,
    amount: maxAmountToWithdraw.toString(),
  })
  const maxBalance = useMaxBalance({
    tx: withdrawEstimationTx ?? null,
    assetId: relatedATokenId,
    feePctBuffer: 0.5,
  })
  const maxAmountToWithdrawWithFee =
    maxBalance?.maxBalanceHuman ?? maxAmountToWithdraw.toString()

  const underlyingBalance = Big(userReserve?.underlyingBalance || "0")
  const isMaxSelected =
    !!_amount && Big(_amount).gte(maxAmountToWithdrawWithFee)
  const withdrawAmount = isMaxSelected ? maxAmountToWithdrawWithFee : _amount

  const isMaxExceeded =
    !!withdrawAmount && Big(withdrawAmount).gt(maxAmountToWithdrawWithFee)

  const handleChange = (value: string) => {
    const maxSelected =
      !!value && Big(value).gte(maxAmountToWithdrawWithFee.toString())
    amountRef.current = maxSelected ? maxAmountToWithdrawWithFee : value
    setAmount(value)
    if (maxSelected && Big(maxAmountToWithdrawWithFee).eq(underlyingBalance)) {
      setWithdrawMax("-1")
    } else {
      setWithdrawMax(maxAmountToWithdrawWithFee)
    }
  }

  const assetsBlockingWithdraw: string[] = zeroLTVBlockingWithdraw(user)

  const healthFactorAfterWithdraw = calculateHFAfterWithdraw({
    user,
    userReserve,
    poolReserve,
    withdrawAmount,
  })

  const { blockingError, errorText } = useWithdrawError({
    assetsBlockingWithdraw,
    poolReserve,
    healthFactorAfterWithdraw,
    withdrawAmount,
  })

  // calculating input usd value
  const usdValue = Big(withdrawAmount || "0").mul(
    userReserve?.reserve.priceInUSD || 0,
  )

  const healthFactor = user ? user.healthFactor : "-1"
  const futureHealthFactor = healthFactorAfterWithdraw.toString()

  const hf = formatHealthFactorResult({
    currentHF: healthFactor,
    futureHF: futureHealthFactor,
  })

  const displayHealthFactorRiskCheckbox =
    hf.isUserConsentRequired && userReserve.usageAsCollateralEnabledOnUser

  return (
    <>
      <AssetInput
        value={withdrawAmount}
        onChange={handleChange}
        displayValue={usdValue.toString()}
        symbol={symbol}
        assets={[
          {
            balance: maxAmountToWithdrawWithFee,
            symbol: symbol,
            iconSymbol: poolReserve.iconSymbol,
            address: poolReserve.underlyingAsset,
          },
        ]}
        isDisabled={withdrawTxState.loading}
        maxButtonBalance={maxAmountToWithdrawWithFee}
        balanceLabel="Withdrawable balance"
        amountError={
          isMaxExceeded ? "Insufficient balance on your account." : errorText
        }
      />

      <Separator mx="var(--modal-content-inset)" />

      <Stack
        separated
        separator={<Separator mx="var(--modal-content-inset)" />}
        withTrailingSeparator
      >
        <SummaryRow
          label="Remaining supply"
          content={
            <ValueDetail
              value={formatCurrency(
                underlyingBalance.minus(withdrawAmount || "0").toString(),
                {
                  symbol,
                },
              )}
            />
          }
        />
        <SummaryRow
          label="Health Factor"
          content={<HealthFactorChange {...hf} />}
        />

        {displayHealthFactorRiskCheckbox && (
          <HealthFactorRiskWarning
            py="m"
            message="Withdrawing this amount will reduce your health factor and increase risk of liquidation."
            accepted={healthFactorRiskCheckboxAccepted}
            onAcceptedChange={setHealthFactorRiskCheckboxAccepted}
            isUserConsentRequired
          />
        )}
      </Stack>

      <WithdrawActions
        poolReserve={poolReserve}
        amountToWithdraw={isMaxSelected ? withdrawMax : withdrawAmount}
        amount={withdrawAmount}
        poolAddress={poolReserve.underlyingAsset}
        symbol={symbol}
        blocked={
          blockingError !== undefined ||
          (displayHealthFactorRiskCheckbox &&
            !healthFactorRiskCheckboxAccepted) ||
          isMaxExceeded
        }
      />
    </>
  )
}
