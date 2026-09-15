import { formatNumber } from "@galacticcouncil/utils"
import Big from "big.js"
import { ChevronDown } from "lucide-react"
import { ReactNode } from "react"

import {
  Flex,
  FormLabel,
  Icon,
  LogoSkeleton,
  MicroButton,
  Skeleton,
  Text,
} from "@/components"
import { FormError } from "@/components/FormError"
import { getToken } from "@/utils"

import {
  SAssetButton,
  SAssetButtonEmpty,
  SAssetInput,
} from "./AssetInput.styled"
import { defaultAssetValueFormatter } from "./AssetInput.utils"

export type AssetInputProps = {
  label?: ReactNode
  balanceLabel?: string
  symbol?: string
  value?: string
  valueLoading?: boolean
  displayValue?: string
  displayValueLoading?: boolean
  maxBalance?: string
  maxBalanceLoading?: boolean
  maxButtonBalance?: string
  ignoreBalance?: boolean
  ignoreDisplayValue?: boolean
  hideMaxBalanceAction?: boolean
  assetError?: string
  amountError?: string
  disabled?: boolean
  disabledInput?: boolean
  hideInput?: boolean
  modalDisabled?: boolean
  loading?: boolean
  selectedAssetIcon?: ReactNode
  onChange?: (value: string) => void
  onAsssetBtnClick?: () => void
  onMaxButtonClick?: (value: string) => void
  className?: string
}

export const AssetInput = ({
  symbol,
  selectedAssetIcon,
  value,
  valueLoading,
  displayValue,
  displayValueLoading,
  label,
  balanceLabel,
  maxBalance,
  maxBalanceLoading,
  maxButtonBalance,
  onMaxButtonClick,
  ignoreBalance,
  ignoreDisplayValue,
  hideMaxBalanceAction,
  onChange,
  assetError,
  amountError,
  disabled,
  disabledInput,
  hideInput,
  modalDisabled,
  loading,
  onAsssetBtnClick,
  className,
}: AssetInputProps) => {
  const usedMaxBalance = maxButtonBalance || maxBalance
  const isMaxDisabled =
    Big(usedMaxBalance || "0").lte(0) ||
    loading ||
    maxBalanceLoading ||
    !onChange ||
    !!disabled

  const handleMaxButtonClick = () => {
    if (usedMaxBalance) {
      onChange?.(usedMaxBalance)
      onMaxButtonClick?.(usedMaxBalance)
    }
  }

  const isLoading = valueLoading || displayValueLoading || loading

  return (
    <Flex
      direction="column"
      gap="m"
      py="l"
      width="100%"
      sx={{ position: "relative", minWidth: 0, overflow: "hidden" }}
      className={className}
    >
      <Flex align="center" gap="s" justify="space-between" sx={{ minWidth: 0 }}>
        {label &&
          (typeof label === "string" ? <FormLabel>{label}</FormLabel> : label)}
        {!ignoreBalance && (
          <Flex
            align="center"
            gap="s"
            sx={{ marginLeft: "auto", flexShrink: 0 }}
          >
            <Text
              as="div"
              color={getToken("text.low")}
              fs="p5"
              fw={500}
              truncate
              sx={{
                lineHeight: "120%",
              }}
            >
              {loading || maxBalanceLoading ? (
                <Skeleton sx={{ width: "3xl" }} height="1em" />
              ) : (
                <>
                  <span>{balanceLabel ?? "Balance"}: </span>
                  <span>{maxBalance ? formatNumber(maxBalance) : ""}</span>
                </>
              )}
            </Text>
            {!hideMaxBalanceAction && (
              <MicroButton
                aria-label="Max balance button"
                onClick={handleMaxButtonClick}
                disabled={isMaxDisabled}
              >
                max
              </MicroButton>
            )}
          </Flex>
        )}
      </Flex>
      <Flex direction="column" sx={{ minWidth: 0 }}>
        <Flex
          width="100%"
          align="center"
          gap="m"
          sx={{
            minWidth: 0,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: hideInput
              ? "minmax(0, 1fr)"
              : "auto minmax(0, 1fr)",
          }}
        >
          <AssetButton
            symbol={symbol}
            icon={selectedAssetIcon}
            loading={loading}
            error={!!assetError && !isLoading}
            onAsssetBtnClick={onAsssetBtnClick}
            disabled={!!modalDisabled || !!disabled}
          />
          {!hideInput && (
            <Flex
              direction="column"
              height="2.375rem"
              justify="space-evenly"
              align="end"
              sx={{ minWidth: 0, overflow: "hidden" }}
            >
              {valueLoading ? (
                <Skeleton sx={{ width: "3xl" }} height="1em" />
              ) : (
                <SAssetInput
                  isError={!!amountError && !isLoading}
                  placeholder="0"
                  variant="embedded"
                  autoComplete="off"
                  inputMode="decimal"
                  disabled={disabled || loading || !onChange || disabledInput}
                  value={defaultAssetValueFormatter(value ?? "")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.validity.valid) {
                      const formattedValue = e.target.value
                        .replace(/\s+/g, "")
                        .replace(/,/g, ".")

                      if (!isNaN(Number(formattedValue))) {
                        onChange?.(formattedValue)
                      }
                    }
                  }}
                />
              )}

              {amountError && !isLoading ? (
                <FormError
                  fs="p6"
                  fw={400}
                  lh={1}
                  truncate
                  width="100%"
                  align="right"
                >
                  {amountError}
                </FormError>
              ) : (
                !ignoreDisplayValue && (
                  <Text
                    color={getToken("text.low")}
                    fs="p6"
                    fw={400}
                    lh={1}
                    truncate
                    width="100%"
                    align="right"
                  >
                    {displayValueLoading ? (
                      <Skeleton width={48} />
                    ) : (
                      displayValue
                    )}
                  </Text>
                )
              )}
            </Flex>
          )}
        </Flex>
        {assetError && !isLoading && (
          <FormError lh={1} ml="auto">
            {assetError}
          </FormError>
        )}
      </Flex>
    </Flex>
  )
}

export const AssetButton = ({
  loading,
  symbol,
  error,
  icon,
  disabled,
  className,
  onAsssetBtnClick,
}: {
  loading?: boolean
  symbol?: string
  icon?: ReactNode
  error: boolean
  disabled?: boolean
  className?: string
  onAsssetBtnClick?: () => void
}) => {
  if (loading)
    return (
      <Flex gap="s" justify="center" className={className}>
        <LogoSkeleton size="medium" />
        <Skeleton sx={{ width: "2xl" }} />
      </Flex>
    )

  if (symbol && icon)
    return (
      <SAssetButton
        className={className}
        type="button"
        disabled={!!disabled}
        isError={!!error}
        onClick={onAsssetBtnClick}
      >
        {icon}
        <Flex flex={1} align="center" gap="s" justify="space-between">
          <Text
            color={getToken("text.high")}
            fw={600}
            fs="p3"
            whiteSpace="nowrap"
          >
            {symbol}
          </Text>
          {onAsssetBtnClick && (
            <Icon
              size="s"
              mr="-base"
              component={ChevronDown}
              color={getToken("icons.onContainer")}
            />
          )}
        </Flex>
      </SAssetButton>
    )

  return (
    <SAssetButtonEmpty
      variant="secondary"
      sx={{ justifyContent: "space-between" }}
      className={className}
      onClick={onAsssetBtnClick}
    >
      <Text fw={600} fs="p3" whiteSpace="nowrap">
        Select asset
      </Text>
      {!disabled && <Icon size="s" component={ChevronDown} />}
    </SAssetButtonEmpty>
  )
}
