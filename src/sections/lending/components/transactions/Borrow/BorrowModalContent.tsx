import { API_ETH_MOCK_ADDRESS, InterestRate } from "@aave/contract-helpers"
import {
  USD_DECIMALS,
  calculateHealthFactorFromBalancesBigUnits,
  valueToBigNumber,
} from "@aave/math-utils"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { PercentageValue } from "components/PercentageValue"
import { ToggleGroup, ToggleGroupItem } from "components/ToggleGroup"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { CapType } from "sections/lending/components/caps/helper"
import { GasEstimationError } from "sections/lending/components/transactions/FlowCommons/GasEstimationError"
import { ModalWrapperProps } from "sections/lending/components/transactions/FlowCommons/ModalWrapper"
import { TxSuccessView } from "sections/lending/components/transactions/FlowCommons/Success"
import {
  DetailsHFLine,
  DetailsIncentivesLine,
  DetailsUnwrapSwitch,
  TxModalDetails,
} from "sections/lending/components/transactions/FlowCommons/TxModalDetails"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useAssetCaps } from "sections/lending/hooks/useAssetCaps"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { ERC20TokenType } from "sections/lending/libs/web3-data-provider/Web3Provider"
import { AssetInput } from "sections/lending/ui/transactions/AssetInput"
import { getMaxAmountAvailableToBorrow } from "sections/lending/utils/getMaxAmountAvailableToBorrow"
import { roundToTokenDecimals } from "sections/lending/utils/utils"
import { BorrowActions } from "./BorrowActions"
import { BorrowAmountWarning } from "./BorrowAmountWarning"
import { ParameterChangewarning } from "./ParameterChangewarning"

export enum ErrorType {
  STABLE_RATE_NOT_ENABLED,
  NOT_ENOUGH_LIQUIDITY,
  BORROWING_NOT_AVAILABLE,
  NOT_ENOUGH_BORROWED,
}

interface BorrowModeSwitchProps {
  interestRateMode: InterestRate
  setInterestRateMode: (value: InterestRate) => void
  variableRate: string
  stableRate: string
}

const BorrowModeSwitch = ({
  setInterestRateMode,
  interestRateMode,
  variableRate,
  stableRate,
}: BorrowModeSwitchProps) => {
  return (
    <div sx={{ mb: 16 }}>
      <Text
        fs={14}
        color="basic400"
        sx={{ mb: 4, flex: "row", align: "center", gap: 4 }}
      >
        Borrow APY Rate{" "}
        <InfoTooltip text="Allows you to switch between variable and stable interest rates, where variable rate can increase and decrease depending on the amount of liquidity in the reserve, and stable rate will stay the same for the duration of your loan.">
          <SInfoIcon />
        </InfoTooltip>
      </Text>
      <ToggleGroup
        type="single"
        value={interestRateMode}
        onValueChange={setInterestRateMode}
      >
        <ToggleGroupItem value={InterestRate.Variable}>
          <span sx={{ mr: 4 }}>Variable</span>
          <PercentageValue value={Number(variableRate) * 100} />
        </ToggleGroupItem>
        <ToggleGroupItem value={InterestRate.Stable}>
          <span sx={{ mr: 4 }}>Stable</span>
          <PercentageValue value={Number(stableRate) * 100} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

export const BorrowModalContent = ({
  underlyingAsset,
  isWrongNetwork,
  poolReserve,
  userReserve,
  unwrap: borrowUnWrapped,
  setUnwrap: setBorrowUnWrapped,
  symbol,
}: ModalWrapperProps & {
  unwrap: boolean
  setUnwrap: (unwrap: boolean) => void
}) => {
  const { mainTxState: borrowTxState, gasLimit, txError } = useModalContext()
  const { user, marketReferencePriceInUsd } = useAppDataContext()
  const { currentNetworkConfig } = useProtocolDataContext()
  const { borrowCap } = useAssetCaps()

  const [interestRateMode, setInterestRateMode] = useState<InterestRate>(
    InterestRate.Variable,
  )
  const [amount, setAmount] = useState("")
  const [riskCheckboxAccepted, setRiskCheckboxAccepted] = useState(false)

  // amount calculations
  const maxAmountToBorrow = getMaxAmountAvailableToBorrow(
    poolReserve,
    user,
    interestRateMode,
  )

  // We set this in a useEffect, so it doesn't constantly change when
  // max amount selected
  const handleChange = (_value: string) => {
    if (_value === "-1") {
      setAmount(maxAmountToBorrow)
    } else {
      const decimalTruncatedValue = roundToTokenDecimals(
        _value,
        poolReserve.decimals,
      )
      setAmount(decimalTruncatedValue)
    }
  }

  const isMaxSelected = amount === maxAmountToBorrow

  // health factor calculations
  const amountToBorrowInUsd = valueToBigNumber(amount)
    .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
    .multipliedBy(marketReferencePriceInUsd)
    .shiftedBy(-USD_DECIMALS)

  const newHealthFactor = calculateHealthFactorFromBalancesBigUnits({
    collateralBalanceMarketReferenceCurrency: user.totalCollateralUSD,
    borrowBalanceMarketReferenceCurrency: valueToBigNumber(
      user.totalBorrowsUSD,
    ).plus(amountToBorrowInUsd),
    currentLiquidationThreshold: user.currentLiquidationThreshold,
  })
  const displayRiskCheckbox =
    newHealthFactor.toNumber() < 1.5 && newHealthFactor.toString() !== "-1"

  // calculating input usd value
  const usdValue = valueToBigNumber(amount).multipliedBy(poolReserve.priceInUSD)

  // error types handling
  let blockingError: ErrorType | undefined = undefined
  if (
    interestRateMode === InterestRate.Stable &&
    !poolReserve.stableBorrowRateEnabled
  ) {
    blockingError = ErrorType.STABLE_RATE_NOT_ENABLED
  } else if (
    interestRateMode === InterestRate.Stable &&
    userReserve?.usageAsCollateralEnabledOnUser &&
    valueToBigNumber(amount).lt(userReserve?.underlyingBalance || 0)
  ) {
    blockingError = ErrorType.NOT_ENOUGH_BORROWED
  } else if (
    valueToBigNumber(amount).gt(poolReserve.formattedAvailableLiquidity)
  ) {
    blockingError = ErrorType.NOT_ENOUGH_LIQUIDITY
  } else if (!poolReserve.borrowingEnabled) {
    blockingError = ErrorType.BORROWING_NOT_AVAILABLE
  }

  // error render handling
  const handleBlocked = () => {
    switch (blockingError) {
      case ErrorType.BORROWING_NOT_AVAILABLE:
        return (
          <span>
            Borrowing is currently unavailable for {poolReserve.symbol}.
          </span>
        )
      case ErrorType.NOT_ENOUGH_BORROWED:
        return (
          <span>
            You can borrow this asset with a stable rate only if you borrow more
            than the amount you are supplying as collateral.
          </span>
        )
      case ErrorType.NOT_ENOUGH_LIQUIDITY:
        return (
          <>
            <span>
              There are not enough funds in the
              {poolReserve.symbol}
              reserve to borrow
            </span>
          </>
        )
      case ErrorType.STABLE_RATE_NOT_ENABLED:
        return <span>The Stable Rate is not enabled for this currency</span>
      default:
        return null
    }
  }

  // token info to add to wallet
  const addToken: ERC20TokenType = {
    address: underlyingAsset,
    symbol: poolReserve.iconSymbol,
    decimals: poolReserve.decimals,
  }

  const iconSymbol =
    borrowUnWrapped && poolReserve.isWrappedBaseAsset
      ? currentNetworkConfig.baseAssetSymbol
      : poolReserve.iconSymbol

  if (borrowTxState.success)
    return (
      <TxSuccessView
        action={<span>Borrowed</span>}
        amount={amount}
        symbol={iconSymbol}
        addToken={
          borrowUnWrapped && poolReserve.isWrappedBaseAsset
            ? undefined
            : addToken
        }
      />
    )

  const incentive =
    interestRateMode === InterestRate.Stable
      ? poolReserve.sIncentivesData
      : poolReserve.vIncentivesData
  return (
    <>
      {borrowCap.determineWarningDisplay({ borrowCap })}

      {poolReserve.stableBorrowRateEnabled && (
        <BorrowModeSwitch
          interestRateMode={interestRateMode}
          setInterestRateMode={setInterestRateMode}
          variableRate={poolReserve.variableBorrowAPY}
          stableRate={poolReserve.stableBorrowAPY}
        />
      )}

      <AssetInput
        name="borrow-amount"
        value={amount}
        onChange={handleChange}
        usdValue={usdValue.toString(10)}
        assets={[
          {
            balance: maxAmountToBorrow,
            symbol,
            iconSymbol,
          },
        ]}
        symbol={symbol}
        capType={CapType.borrowCap}
        isMaxSelected={isMaxSelected}
        maxValue={maxAmountToBorrow}
        balanceText={<span>Available</span>}
      />

      {blockingError !== undefined && (
        <Text fs={12} color="red400">
          {handleBlocked()} asddas d
        </Text>
      )}

      {poolReserve.isWrappedBaseAsset && (
        <DetailsUnwrapSwitch
          unwrapped={borrowUnWrapped}
          setUnWrapped={setBorrowUnWrapped}
          label={`Unwrap ${poolReserve.symbol} (to borrow ${currentNetworkConfig.baseAssetSymbol})`}
        />
      )}

      <TxModalDetails gasLimit={gasLimit}>
        <DetailsIncentivesLine
          incentives={incentive}
          symbol={poolReserve.symbol}
        />
        <DetailsHFLine
          visibleHfChange={!!amount}
          healthFactor={user.healthFactor}
          futureHealthFactor={newHealthFactor.toString(10)}
        />
      </TxModalDetails>

      {txError && <GasEstimationError txError={txError} />}

      {displayRiskCheckbox && (
        <BorrowAmountWarning
          riskCheckboxAccepted={riskCheckboxAccepted}
          onRiskCheckboxChange={() => {
            setRiskCheckboxAccepted(!riskCheckboxAccepted)
          }}
        />
      )}

      <ParameterChangewarning underlyingAsset={underlyingAsset} />

      <BorrowActions
        poolReserve={poolReserve}
        amountToBorrow={amount}
        poolAddress={
          borrowUnWrapped && poolReserve.isWrappedBaseAsset
            ? API_ETH_MOCK_ADDRESS
            : poolReserve.underlyingAsset
        }
        interestRateMode={interestRateMode}
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
