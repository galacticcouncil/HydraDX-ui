import {
  FieldPathByValue,
  FieldValues,
  useController,
  useFormContext,
} from "react-hook-form"

import { TAssetData } from "@/api/assets"
import {
  AssetSelect,
  AssetSelectProps,
  TSelectedAsset,
} from "@/components/AssetSelect/AssetSelect"
import { TAsset } from "@/providers/assetsProvider"

type Props<TFormValues extends FieldValues> = Omit<
  AssetSelectProps,
  "selectedAsset" | "setSelectedAsset" | "value" | "onChange" | "error"
> & {
  readonly assetFieldName: FieldPathByValue<TFormValues, TSelectedAsset | null>
  readonly amountFieldName: FieldPathByValue<TFormValues, string>
  readonly onAssetChange?: (asset: TAsset, previousAsset: TAsset | null) => void
  readonly onAmountChange?: (amount: string) => void
  readonly disabledAssetSelector?: boolean
}

export const AssetSelectFormField = <TFormValues extends FieldValues>({
  assetFieldName,
  amountFieldName,
  onAssetChange,
  onAmountChange,
  disabledAssetSelector = false,
  ...assetSelectProps
}: Props<TFormValues>) => {
  const { control } = useFormContext<TFormValues>()

  const { field: assetField, fieldState: assetFieldState } = useController({
    control,
    name: assetFieldName,
    disabled: disabledAssetSelector,
  })
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: amountFieldName,
  })

  const setSelectedAsset = (asset: TAssetData) => {
    if (!disabledAssetSelector) {
      assetField.onChange(asset)
    }
    onAssetChange?.(asset, assetField.value)
  }

  return (
    <AssetSelect
      {...assetSelectProps}
      selectedAsset={assetField.value}
      setSelectedAsset={!disabledAssetSelector ? setSelectedAsset : undefined}
      value={amountField.value}
      onChange={(value) => {
        amountField.onChange(value)
        onAmountChange?.(value)
      }}
      assetError={assetFieldState.error?.message}
      amountError={amountFieldState.error?.message}
    />
  )
}
