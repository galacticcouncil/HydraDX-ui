import { AssetInput, AssetInputProps } from "@galacticcouncil/ui/components"
import { useState } from "react"

import { ChainAssetSelectDialog } from "@/modules/trade/swap/sections/XcSwap/components/ChainAssetSelect"
import { XcAssetLogo } from "@/modules/trade/swap/sections/XcSwap/components/ChainAssetSelect/XcLogo"
import {
  XcAsset,
  XcChain,
  XcChainAssetPair,
} from "@/modules/trade/swap/sections/XcSwap/types"

export type XcChainAssetSelectProps = Omit<
  AssetInputProps,
  "asset" | "onAssetClick"
> & {
  readonly chainAssetPairs: XcChainAssetPair[]
  readonly selectedChain: XcChain | null
  readonly selectedAsset: XcAsset | null
  readonly modalTitle: string
  readonly onSelectionChange?: (selection: XcChainAssetPair) => void
  readonly disabledAssetSelector?: boolean
}

export const XcChainAssetSelect = ({
  chainAssetPairs,
  selectedChain,
  selectedAsset,
  modalTitle,
  onSelectionChange,
  disabledAssetSelector = false,
  ...assetInputProps
}: XcChainAssetSelectProps) => {
  const [open, setOpen] = useState(false)

  const currentSelection =
    selectedChain && selectedAsset
      ? { chain: selectedChain, asset: selectedAsset }
      : null

  return (
    <>
      <AssetInput
        {...assetInputProps}
        asset={
          currentSelection
            ? {
                symbol: currentSelection.asset.symbol,
                icon: <XcAssetLogo asset={currentSelection.asset} />,
              }
            : null
        }
        onAssetClick={!disabledAssetSelector ? () => setOpen(true) : undefined}
      />

      <ChainAssetSelectDialog
        open={open}
        onOpenChange={setOpen}
        title={modalTitle}
        chainAssetPairs={chainAssetPairs}
        currentSelection={currentSelection}
        onAssetSelect={onSelectionChange ?? (() => {})}
      />
    </>
  )
}
