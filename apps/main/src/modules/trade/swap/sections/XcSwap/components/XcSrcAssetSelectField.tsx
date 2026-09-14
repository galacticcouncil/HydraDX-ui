import { useController, useFormContext } from "react-hook-form"

import { TAssetData } from "@/api/assets"
import {
  AssetSelect,
  TSelectedAsset,
} from "@/components/AssetSelect/AssetSelect"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { useAssets } from "@/providers/assetsProvider"

type Props = {
  readonly label: string
  readonly labelAdornment?: React.ReactNode
  readonly isLoading?: boolean
  readonly maxBalance?: string
  readonly isMaxBalanceLoading?: boolean
  readonly onAssetChange?: (
    asset: TAssetData,
    previousAsset: TAssetData | null,
  ) => void
  readonly onAmountChange?: (amount: string) => void
}

export const XcSrcAssetSelectField: React.FC<Props> = ({
  label,
  labelAdornment,
  isLoading,
  maxBalance,
  isMaxBalanceLoading,
  onAssetChange,
  onAmountChange,
}) => {
  const { tradable } = useAssets()
  const { control } = useFormContext<XcSwapFormValues>()

  const { field: assetField, fieldState: assetFieldState } = useController({
    control,
    name: "sellAsset",
  })
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: "sellAmount",
  })

  const sellAsset = assetField.value
  const selectedAsset: TSelectedAsset | null = sellAsset
    ? {
        id: sellAsset.id,
        iconId: sellAsset.id,
        symbol: sellAsset.symbol,
        decimals: sellAsset.decimals,
      }
    : null

  return (
    <AssetSelect
      label={label}
      labelAdornment={labelAdornment}
      assets={tradable}
      selectedAsset={selectedAsset}
      setSelectedAsset={(asset) => {
        const previousAsset = sellAsset
        assetField.onChange(asset)
        onAssetChange?.(asset, previousAsset)
      }}
      value={amountField.value}
      onChange={(value) => {
        amountField.onChange(value)
        onAmountChange?.(value)
      }}
      assetError={assetFieldState.error?.message}
      amountError={amountFieldState.error?.message}
      balance={{ value: maxBalance, isLoading: isMaxBalanceLoading }}
      isLoading={isLoading}
    />
  )
}
