import {
  AssetInput,
  AssetInputBalance,
  AssetInputProps,
} from "@galacticcouncil/ui/components"
import Big from "big.js"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import { AssetLogo } from "@/components/AssetLogo"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { AssetSelectEmptyState } from "@/components/AssetSelect/AssetSelectEmptyState"
import { AssetSelectModal } from "@/components/AssetSelectModal"
import { TAssetWithBalance } from "@/components/AssetSelectModal/AssetSelectModal.utils"
import { scaleHuman } from "@/utils/formatting"

export type TSelectedAsset = {
  id: string
  decimals: number
  symbol: string
  iconId?: string | string[]
}

export type AssetSelectBalance = Omit<
  Partial<AssetInputBalance>,
  "value" | "onMax"
> & {
  /** Human amount; defaults to the account balance of the selected asset */
  value?: string
  /** Amount the max button sets; defaults to `value` */
  max?: string
  /** Called after max is applied; `null` hides the max button */
  onMax?: (() => void) | null
}

export type AssetSelectProps = Omit<
  AssetInputProps,
  "asset" | "onAssetClick" | "balance"
> & {
  assets: TAssetData[]
  sortedAssets?: TAssetWithBalance[]
  selectedAsset: TSelectedAsset | undefined | null
  setSelectedAsset?: (asset: TAssetData) => void
  balance?: AssetSelectBalance | false
  onLockToggle?: () => void
}

export const AssetSelect = ({
  assets,
  sortedAssets,
  selectedAsset,
  setSelectedAsset,
  balance: balanceOverride,
  onLockToggle,
  ...props
}: AssetSelectProps) => {
  const { t } = useTranslation()
  const [openModal, setOpenModal] = useState(false)

  const hasDisplayValue = props.displayValue !== undefined
  const [fetchedDisplayValue, { isLoading: isFetchedDisplayValueLoading }] =
    useDisplayAssetPrice(
      hasDisplayValue ? "" : (selectedAsset?.id ?? ""),
      props.value || "0",
    )

  const { getTransferableBalance, getBalance, isBalanceLoading } =
    useAccountBalances()

  const override = balanceOverride || {}
  const isMaxHidden = override.onMax === null

  const accountBalance = (() => {
    if (!selectedAsset) return undefined

    // without a max action, show the full balance rather than the transferable part
    const amount = isMaxHidden
      ? getBalance(selectedAsset.id)?.total
      : getTransferableBalance(selectedAsset.id)

    return amount !== undefined
      ? scaleHuman(amount, selectedAsset.decimals)
      : undefined
  })()

  const balanceValue = override.value || accountBalance || "0"
  const max = override.max || balanceValue

  const balance: AssetInputBalance | undefined =
    balanceOverride === false
      ? undefined
      : {
          label: override.label ?? t("balance"),
          value: t("number", { value: balanceValue }),
          isLoading: override.isLoading ?? isBalanceLoading,
          onMax: isMaxHidden
            ? null
            : () => {
                props.onChange?.(max)
                override.onMax?.()
              },
          isMaxDisabled:
            override.isMaxDisabled ?? (!props.onChange || Big(max).lte(0)),
        }

  return (
    <>
      <AssetInput
        {...props}
        onLock={onLockToggle ?? props.onLock}
        asset={
          selectedAsset
            ? {
                symbol: selectedAsset.symbol,
                icon: (
                  <AssetLogo id={selectedAsset.iconId ?? selectedAsset.id} />
                ),
              }
            : null
        }
        onAssetClick={setSelectedAsset ? () => setOpenModal(true) : undefined}
        selectAssetLabel={props.selectAssetLabel ?? t("selectAsset")}
        displayValue={
          hasDisplayValue ? props.displayValue : fetchedDisplayValue
        }
        isDisplayValueLoading={
          props.isDisplayValueLoading ?? isFetchedDisplayValueLoading
        }
        balance={balance}
      />

      <AssetSelectModal
        open={openModal}
        assets={assets}
        sortedAssets={sortedAssets}
        onOpenChange={setOpenModal}
        onSelect={setSelectedAsset}
        emptyState={<AssetSelectEmptyState />}
        selectedAssetId={selectedAsset?.id}
      />
    </>
  )
}
