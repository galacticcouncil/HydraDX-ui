import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers"
import { valueToBigNumber } from "@aave/math-utils"
import { Checkbox, Typography } from "@mui/material"
import { useRef, useState } from "react"
import { Warning } from "sections/lending/components/primitives/Warning"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { calculateHFAfterWithdraw } from "sections/lending/utils/hfUtils"

import { GasEstimationError } from "sections/lending/components/transactions/FlowCommons/GasEstimationError"
import { ModalWrapperProps } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { TxSuccessView } from "sections/lending/components/transactions/FlowCommons/Success"
import {
  DetailsHFLine,
  DetailsNumberLine,
  DetailsUnwrapSwitch,
  TxModalDetails,
} from "sections/lending/components/transactions/FlowCommons/TxModalDetails"
import { zeroLTVBlockingWithdraw } from "sections/lending/components/transactions/utils"
import { AssetInput } from "sections/lending/ui/transactions/AssetInput"
import { WithdrawActions } from "./WithdrawActions"
import { useWithdrawError } from "./WithdrawError"
import { calculateMaxWithdrawAmount } from "./utils"

export enum ErrorType {
  CAN_NOT_WITHDRAW_THIS_AMOUNT,
  POOL_DOES_NOT_HAVE_ENOUGH_LIQUIDITY,
  ZERO_LTV_WITHDRAW_BLOCKED,
}

export const WithdrawModalContent = ({
  poolReserve,
  userReserve,
  unwrap: withdrawUnWrapped,
  setUnwrap: setWithdrawUnWrapped,
  symbol,
  isWrongNetwork,
}: ModalWrapperProps & {
  unwrap: boolean
  setUnwrap: (unwrap: boolean) => void
}) => {
  const { gasLimit, mainTxState: withdrawTxState, txError } = useModalContext()
  const { user } = useAppDataContext()
  const { currentNetworkConfig } = useProtocolDataContext()

  const [_amount, setAmount] = useState("")
  const [withdrawMax, setWithdrawMax] = useState("")
  const [riskCheckboxAccepted, setRiskCheckboxAccepted] = useState(false)
  const amountRef = useRef<string>("")
  const isMaxSelected = _amount === "-1"
  const maxAmountToWithdraw = calculateMaxWithdrawAmount(
    user,
    userReserve,
    poolReserve,
  )
  const underlyingBalance = valueToBigNumber(
    userReserve?.underlyingBalance || "0",
  )
  const unborrowedLiquidity = valueToBigNumber(poolReserve.unborrowedLiquidity)
  const withdrawAmount = isMaxSelected
    ? maxAmountToWithdraw.toString(10)
    : _amount

  const handleChange = (value: string) => {
    const maxSelected = value === "-1"
    amountRef.current = maxSelected ? maxAmountToWithdraw.toString(10) : value
    setAmount(value)
    if (maxSelected && maxAmountToWithdraw.eq(underlyingBalance)) {
      setWithdrawMax("-1")
    } else {
      setWithdrawMax(maxAmountToWithdraw.toString(10))
    }
  }

  const assetsBlockingWithdraw: string[] = zeroLTVBlockingWithdraw(user)

  const healthFactorAfterWithdraw = calculateHFAfterWithdraw({
    user,
    userReserve,
    poolReserve,
    withdrawAmount,
  })

  const { blockingError, errorComponent } = useWithdrawError({
    assetsBlockingWithdraw,
    poolReserve,
    healthFactorAfterWithdraw,
    withdrawAmount,
  })

  const displayRiskCheckbox =
    healthFactorAfterWithdraw.toNumber() >= 1 &&
    healthFactorAfterWithdraw.toNumber() < 1.5 &&
    userReserve.usageAsCollateralEnabledOnUser

  // calculating input usd value
  const usdValue = valueToBigNumber(withdrawAmount).multipliedBy(
    userReserve?.reserve.priceInUSD || 0,
  )

  if (withdrawTxState.success)
    return (
      <TxSuccessView
        action={<span>withdrew</span>}
        amount={amountRef.current}
        symbol={
          withdrawUnWrapped && poolReserve.isWrappedBaseAsset
            ? currentNetworkConfig.baseAssetSymbol
            : poolReserve.symbol
        }
      />
    )

  return (
    <>
      <AssetInput
        name="withdraw-amount"
        value={withdrawAmount}
        onChange={handleChange}
        symbol={symbol}
        assets={[
          {
            balance: maxAmountToWithdraw.toString(10),
            symbol: symbol,
            iconSymbol:
              withdrawUnWrapped && poolReserve.isWrappedBaseAsset
                ? currentNetworkConfig.baseAssetSymbol
                : poolReserve.iconSymbol,
          },
        ]}
        usdValue={usdValue.toString(10)}
        isMaxSelected={isMaxSelected}
        disabled={withdrawTxState.loading}
        maxValue={maxAmountToWithdraw.toString(10)}
        balanceText={
          unborrowedLiquidity.lt(underlyingBalance) ? (
            <span>Available</span>
          ) : (
            <span>Supply balance</span>
          )
        }
      />

      {blockingError !== undefined && (
        <Typography variant="helperText" color="error.main">
          {errorComponent}
        </Typography>
      )}

      {poolReserve.isWrappedBaseAsset && (
        <DetailsUnwrapSwitch
          unwrapped={withdrawUnWrapped}
          setUnWrapped={setWithdrawUnWrapped}
          label={`Unwrap ${poolReserve.symbol} (to withdraw ${currentNetworkConfig.baseAssetSymbol})`}
        />
      )}

      <TxModalDetails gasLimit={gasLimit}>
        <DetailsNumberLine
          description={<span>Remaining supply</span>}
          value={underlyingBalance.minus(withdrawAmount || "0").toString(10)}
          symbol={
            poolReserve.isWrappedBaseAsset
              ? currentNetworkConfig.baseAssetSymbol
              : poolReserve.symbol
          }
        />
        <DetailsHFLine
          visibleHfChange={!!_amount}
          healthFactor={user ? user.healthFactor : "-1"}
          futureHealthFactor={healthFactorAfterWithdraw.toString(10)}
        />
      </TxModalDetails>

      {txError && <GasEstimationError txError={txError} />}

      {displayRiskCheckbox && (
        <>
          <Warning variant="error" sx={{ my: 24 }}>
            <span>
              Withdrawing this amount will reduce your health factor and
              increase risk of liquidation.
            </span>
          </Warning>
          <div sx={{ flex: "row", align: "center" }}>
            <Checkbox
              checked={riskCheckboxAccepted}
              onChange={() => {
                setRiskCheckboxAccepted(!riskCheckboxAccepted)
              }}
            />
            <Typography variant="description">
              <span>I acknowledge the risks involved.</span>
            </Typography>
          </div>
        </>
      )}

      <WithdrawActions
        poolReserve={poolReserve}
        amountToWithdraw={isMaxSelected ? withdrawMax : withdrawAmount}
        poolAddress={
          withdrawUnWrapped && poolReserve.isWrappedBaseAsset
            ? API_ETH_MOCK_ADDRESS
            : poolReserve.underlyingAsset
        }
        isWrongNetwork={isWrongNetwork}
        symbol={symbol}
        blocked={
          blockingError !== undefined ||
          (displayRiskCheckbox && !riskCheckboxAccepted)
        }
        sx={displayRiskCheckbox ? { mt: 0 } : {}}
      />
    </>
  )
}
