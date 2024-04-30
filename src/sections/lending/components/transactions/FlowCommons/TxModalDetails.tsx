import { ReserveIncentiveResponse } from "@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives"
import { ArrowNarrowRightIcon } from "@heroicons/react/solid"
import { Box, SvgIcon, Typography } from "@mui/material"
import { parseUnits } from "ethers/lib/utils"
import React, { ReactNode } from "react"
import Skeleton from "react-loading-skeleton"
import {
  IsolatedDisabledBadge,
  IsolatedEnabledBadge,
  UnavailableDueToIsolationBadge,
} from "sections/lending/ui/isolation-mode/IsolationBadge"
import { Row } from "sections/lending/components/primitives/Row"
import { CollateralType } from "sections/lending/helpers/types"

import { Switch } from "components/Switch/Switch"
import { Text } from "components/Typography/Text/Text"
import { HealthFactorNumber } from "sections/lending/components/HealthFactorNumber"
import { IncentivesButton } from "sections/lending/components/incentives/IncentivesButton"
import {
  FormattedNumber,
  FormattedNumberProps,
} from "sections/lending/components/primitives/FormattedNumber"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"
import { GasStation } from "sections/lending/components/transactions/GasStation/GasStation"
import { theme } from "theme"
import { useTranslation } from "react-i18next"
import { PercentageValue } from "components/PercentageValue"

export interface TxModalDetailsProps {
  gasLimit?: string
  slippageSelector?: ReactNode
  skipLoad?: boolean
  disabled?: boolean
  chainId?: number
  children?: ReactNode
}

const ArrowRightIcon = (
  <SvgIcon color="primary" sx={{ fontSize: "14px", mx: 4 }}>
    <ArrowNarrowRightIcon />
  </SvgIcon>
)

export const TxModalDetails: React.FC<TxModalDetailsProps> = ({
  gasLimit,
  slippageSelector,
  skipLoad,
  disabled,
  children,
  chainId,
}) => {
  return (
    <div sx={{ pt: 30 }}>
      <Text font="FontOver" color="pink500" fs={15} sx={{ mb: 16 }}>
        <span>Transaction overview</span>
      </Text>
      <div
        css={{
          "& > div": {
            borderTop: `1px solid ${theme.colors.darkBlue401}`,
            paddingTop: 10,
          },
          "& > div:first-of-type": { border: 0, paddingTop: 0 },
        }}
      >
        {children}
      </div>
      <div
        sx={{
          flex: "row",
          justify: "space-between",
        }}
      >
        <GasStation
          chainId={chainId}
          gasLimit={parseUnits(gasLimit || "0", "wei")}
          skipLoad={skipLoad}
          disabled={disabled}
          rightComponent={slippageSelector}
        />
      </div>
    </div>
  )
}

type DetailsNumberLineProps = {
  description: ReactNode
  value: FormattedNumberProps["value"]
  futureValue?: FormattedNumberProps["value"]
  numberPrefix?: ReactNode
  symbol?: string
  iconSymbol?: string
  loading?: boolean
  percent?: boolean
}

export const DetailsNumberLine = ({
  description,
  value,
  futureValue,
  numberPrefix,
  symbol,
  iconSymbol,
  loading = false,
  percent,
}: DetailsNumberLineProps) => {
  const { t } = useTranslation()

  const num = Number(value)
  const futureNum = Number(futureValue)
  return (
    <Row captionColor="basic400" caption={description}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {loading ? (
          <Skeleton height={20} width={100} />
        ) : (
          <>
            {iconSymbol && (
              <TokenIcon symbol={iconSymbol} sx={{ mr: 6, fontSize: 16 }} />
            )}
            {numberPrefix && (
              <Text fs={14} sx={{ mr: 6 }}>
                {numberPrefix}
              </Text>
            )}
            {percent ? (
              <PercentageValue value={num * 100} />
            ) : symbol ? (
              t("value.displaySymbol", { value: num, symbol })
            ) : (
              t("value.displaySymbol", { value: num })
            )}

            {futureValue && (
              <>
                {ArrowRightIcon}
                {percent ? (
                  <PercentageValue value={futureNum * 100} />
                ) : symbol ? (
                  t("value.displaySymbol", { value: futureNum, symbol })
                ) : (
                  t("value.displaySymbol", { value: futureNum })
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Row>
  )
}

interface DetailsNumberLineWithSubProps {
  description: ReactNode
  symbol: ReactNode
  value?: string
  valueUSD?: string
  futureValue: string
  futureValueUSD: string
  hideSymbolSuffix?: boolean
  color?: string
  tokenIcon?: string
  loading?: boolean
}

export const DetailsNumberLineWithSub = ({
  description,
  symbol,
  value,
  valueUSD,
  futureValue,
  futureValueUSD,
  hideSymbolSuffix,
  color,
  tokenIcon,
  loading = false,
}: DetailsNumberLineWithSubProps) => {
  return (
    <Row captionColor="basic400" caption={description}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {loading ? (
          <>
            <Skeleton height={20} width={100} />
            <Skeleton height={15} width={80} sx={{ mt: 12 }} />
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {value && (
                <>
                  <FormattedNumber
                    value={value}
                    variant="secondary14"
                    color={color}
                  />
                  {!hideSymbolSuffix && (
                    <Typography ml={1} variant="secondary14">
                      {symbol}
                    </Typography>
                  )}
                  {ArrowRightIcon}
                </>
              )}
              {tokenIcon && (
                <TokenIcon symbol={tokenIcon} sx={{ mr: 4, fontSize: 14 }} />
              )}
              <FormattedNumber
                value={futureValue}
                variant="secondary14"
                color={color}
              />
              {!hideSymbolSuffix && (
                <Typography ml={1} variant="secondary14">
                  {symbol}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {valueUSD && (
                <>
                  <FormattedNumber
                    value={valueUSD}
                    variant="helperText"
                    compact
                    symbol="USD"
                  />
                  {ArrowRightIcon}
                </>
              )}
              <FormattedNumber
                value={futureValueUSD}
                variant="helperText"
                compact
                symbol="USD"
              />
            </Box>
          </>
        )}
      </Box>
    </Row>
  )
}

export interface DetailsCollateralLineProps {
  collateralType: CollateralType
}

export const DetailsCollateralLine = ({
  collateralType,
}: DetailsCollateralLineProps) => {
  return (
    <Row captionColor="basic400" caption="Collateralization">
      <CollateralState collateralType={collateralType} />
    </Row>
  )
}

interface CollateralStateProps {
  collateralType: CollateralType
}

export const CollateralState = ({ collateralType }: CollateralStateProps) => {
  return (
    <div sx={{ display: "inline-flex", alignItems: "center" }}>
      {
        {
          [CollateralType.ENABLED]: (
            <Text fs={14} color="green400">
              <span>Enabled</span>
            </Text>
          ),
          [CollateralType.ISOLATED_ENABLED]: <IsolatedEnabledBadge />,
          [CollateralType.DISABLED]: (
            <Text fs={14} color="red400">
              <span>Disabled</span>
            </Text>
          ),
          [CollateralType.UNAVAILABLE]: (
            <Text fs={14} color="red400">
              <span>Unavailable</span>
            </Text>
          ),
          [CollateralType.ISOLATED_DISABLED]: <IsolatedDisabledBadge />,
          [CollateralType.UNAVAILABLE_DUE_TO_ISOLATION]: (
            <UnavailableDueToIsolationBadge />
          ),
        }[collateralType]
      }
    </div>
  )
}

interface DetailsIncentivesLineProps {
  futureIncentives?: ReserveIncentiveResponse[]
  futureSymbol?: string
  incentives?: ReserveIncentiveResponse[]
  // the token yielding the incentive, not the incentive itself
  symbol: string
  loading?: boolean
}

export const DetailsIncentivesLine = ({
  incentives,
  symbol,
  futureIncentives,
  futureSymbol,
  loading = false,
}: DetailsIncentivesLineProps) => {
  if (
    !incentives ||
    incentives.filter((i) => i.incentiveAPR !== "0").length === 0
  )
    return null
  return (
    <Row captionColor="basic400" caption={<span>Rewards APR</span>}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {loading ? (
          <Skeleton height={20} width={100} />
        ) : (
          <>
            <IncentivesButton incentives={incentives} symbol={symbol} />
            {futureSymbol && (
              <>
                {ArrowRightIcon}
                <IncentivesButton
                  incentives={futureIncentives}
                  symbol={futureSymbol}
                />
                {futureIncentives && futureIncentives.length === 0 && (
                  <Typography variant="secondary14">
                    <span>None</span>
                  </Typography>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Row>
  )
}

export interface DetailsHFLineProps {
  healthFactor: string
  futureHealthFactor: string
  visibleHfChange: boolean
  loading?: boolean
}

export const DetailsHFLine = ({
  healthFactor,
  futureHealthFactor,
  visibleHfChange,
  loading = false,
}: DetailsHFLineProps) => {
  if (healthFactor === "-1" && futureHealthFactor === "-1") return null
  return (
    <Row captionColor="basic400" caption={<span>Health factor</span>}>
      <Box sx={{ textAlign: "right" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {loading ? (
            <Skeleton height={20} width={80} />
          ) : (
            <>
              <HealthFactorNumber value={healthFactor} />

              {visibleHfChange && (
                <>
                  {ArrowRightIcon}

                  <HealthFactorNumber
                    value={
                      isNaN(Number(futureHealthFactor))
                        ? healthFactor
                        : futureHealthFactor
                    }
                  />
                </>
              )}
            </>
          )}
        </Box>

        <Typography variant="helperText" color="text.secondary">
          <span>Liquidation at</span>
          {" <1.0"}
        </Typography>
      </Box>
    </Row>
  )
}

export interface DetailsUnwrapSwitchProps {
  unwrapped: boolean
  setUnWrapped: (value: boolean) => void
  label: string
}

export const DetailsUnwrapSwitch = ({
  unwrapped,
  setUnWrapped,
  label,
}: DetailsUnwrapSwitchProps) => {
  return (
    <Row sx={{ mt: 10 }}>
      <div sx={{ flex: "row", gap: 10, align: "center" }}>
        <Switch
          name="unwrap-switch"
          label=""
          size="small"
          value={unwrapped}
          onCheckedChange={() => setUnWrapped(!unwrapped)}
        />
        <label htmlFor="unwrap-switch">{label}</label>
      </div>
    </Row>
  )
}
