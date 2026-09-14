import { ChevronDown, LockKeyhole, LockKeyholeOpen } from "lucide-react"
import { ReactNode } from "react"

import { MicroButton } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { LogoSkeleton } from "@/components/Logo"
import { Skeleton } from "@/components/Skeleton"
import { Tooltip } from "@/components/Tooltip"
import { pxToRem } from "@/utils"

import {
  SAmount,
  SAmountInput,
  SAssetButton,
  SAssetGroup,
  SBalance,
  SBalanceText,
  SHeader,
  SLabel,
  SLockButton,
  SOverlay,
  SRoot,
  SSubline,
} from "./AssetInput.styled"
import { defaultAssetValueFormatter } from "./AssetInput.utils"

export type AssetInputAsset = {
  symbol: string
  icon: ReactNode
}

export type AssetInputBalance = {
  label: string
  value: ReactNode
  isLoading?: boolean
  onMax?: (() => void) | null
  isMaxDisabled?: boolean
}

export type AssetInputProps = {
  label?: ReactNode
  labelAdornment?: ReactNode
  asset?: AssetInputAsset | null
  onAssetClick?: () => void
  selectAssetLabel?: string
  value?: string
  onChange?: (value: string) => void
  displayValue?: ReactNode
  balance?: AssetInputBalance
  assetError?: string
  amountError?: string
  isLoading?: boolean
  isValueLoading?: boolean
  isDisplayValueLoading?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  isAmountHidden?: boolean
  isLocked?: boolean
  onLock?: () => void
  lockLabel?: string
  className?: string
}

export const AssetInput = ({
  label,
  labelAdornment,
  asset,
  onAssetClick,
  selectAssetLabel,
  value,
  onChange,
  displayValue,
  balance,
  assetError,
  amountError,
  isLoading = false,
  isValueLoading = false,
  isDisplayValueLoading = false,
  isDisabled = false,
  isReadOnly = false,
  isAmountHidden = false,
  isLocked = false,
  onLock,
  lockLabel,
  className,
}: AssetInputProps) => {
  const isValueBusy = isLoading || isValueLoading
  const error = isLoading
    ? undefined
    : isAmountHidden
      ? assetError
      : (amountError ?? assetError)

  return (
    <SRoot isAmountHidden={isAmountHidden} className={className}>
      {(label || labelAdornment || balance) && (
        <SHeader>
          {label && <SLabel>{label}</SLabel>}
          {labelAdornment}
          {balance && (
            <AssetInputBalanceView
              {...balance}
              isLoading={isLoading || balance.isLoading}
              isDisabled={isDisabled}
            />
          )}
        </SHeader>
      )}

      <SAssetGroup isFullWidth={isAmountHidden}>
        <AssetButton
          asset={asset}
          onClick={onAssetClick}
          selectAssetLabel={selectAssetLabel}
          isLoading={isLoading}
          isError={!!assetError && !isLoading}
          isDisabled={isDisabled}
          fullWidth={isAmountHidden}
        />
        {onLock && (
          <Tooltip text={lockLabel} size="small" asChild>
            <SLockButton
              type="button"
              isLocked={isLocked}
              onClick={onLock}
              aria-label={lockLabel}
            >
              <Icon
                component={isLocked ? LockKeyhole : LockKeyholeOpen}
                size="s"
              />
            </SLockButton>
          </Tooltip>
        )}
      </SAssetGroup>

      {!isAmountHidden && (
        <SAmount>
          <SAmountInput
            variant="embedded"
            placeholder="0"
            autoComplete="off"
            inputMode="decimal"
            aria-busy={isValueBusy}
            isError={!!amountError && !isLoading}
            disabled={isDisabled}
            readOnly={isReadOnly || isValueBusy || !onChange}
            value={defaultAssetValueFormatter(value ?? "")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!e.target.validity.valid) return

              const formattedValue = e.target.value
                .replace(/\s+/g, "")
                .replace(/,/g, ".")

              if (!isNaN(Number(formattedValue))) {
                onChange?.(formattedValue)
              }
            }}
          />
          {isValueBusy && (
            <SOverlay>
              <Skeleton width={pxToRem(64)} height={pxToRem(16)} />
            </SOverlay>
          )}
        </SAmount>
      )}

      <SSubline isError={!!error}>
        {error ??
          (!isAmountHidden &&
            (isLoading || isDisplayValueLoading ? (
              <Skeleton width={pxToRem(48)} height={pxToRem(8)} />
            ) : (
              displayValue
            )))}
      </SSubline>
    </SRoot>
  )
}

const AssetInputBalanceView = ({
  label,
  value,
  isLoading,
  onMax,
  isMaxDisabled,
  isDisabled,
}: AssetInputBalance & { isDisabled: boolean }) => (
  <SBalance>
    <SBalanceText>
      {label}:{" "}
      {isLoading ? <Skeleton width={pxToRem(64)} height="1em" inline /> : value}
    </SBalanceText>
    {onMax && (
      <MicroButton
        onClick={onMax}
        disabled={isLoading || isDisabled || isMaxDisabled}
      >
        max
      </MicroButton>
    )}
  </SBalance>
)

export type AssetButtonProps = {
  asset?: AssetInputAsset | null
  onClick?: () => void
  selectAssetLabel?: string
  isLoading?: boolean
  isError?: boolean
  isDisabled?: boolean
  fullWidth?: boolean
  className?: string
}

export const AssetButton = ({
  asset,
  onClick,
  selectAssetLabel = "Select asset",
  isLoading = false,
  isError = false,
  isDisabled = false,
  fullWidth = false,
  className,
}: AssetButtonProps) => {
  const isInteractive = !!onClick && !isDisabled && !isLoading

  return (
    <SAssetButton
      type="button"
      className={className}
      isLoading={isLoading}
      isEmpty={!asset && !isLoading}
      isError={isError}
      fullWidth={fullWidth}
      disabled={!isInteractive}
      aria-busy={isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <LogoSkeleton size="medium" />
          <Skeleton width={pxToRem(48)} height="1em" />
        </>
      ) : asset ? (
        <>
          {asset.icon}
          {asset.symbol}
        </>
      ) : (
        selectAssetLabel
      )}
      {isInteractive && (
        <Icon
          size="s"
          mr="-s"
          ml={fullWidth ? "auto" : undefined}
          component={ChevronDown}
        />
      )}
    </SAssetButton>
  )
}
