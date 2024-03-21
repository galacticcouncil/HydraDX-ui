import * as React from "react"
import * as UI from "@galacticcouncil/ui"
import { createComponent, EventName } from "@lit-labs/react"
import { u32 } from "@polkadot/types"
import BN from "bignumber.js"
import { useRpcProvider } from "providers/rpcProvider"

export const UigcAsset = createComponent({
  tagName: "uigc-asset",
  elementClass: UI.Asset,
  react: React,
})

export const UigcAssetId = createComponent({
  tagName: "uigc-asset-id",
  elementClass: UI.AssetId,
  react: React,
})

export const UigcAssetTransfer = createComponent({
  tagName: "uigc-asset-transfer",
  elementClass: UI.AssetTransfer,
  react: React,
  events: {
    onAssetInputChange: "asset-input-change" as EventName<CustomEvent>,
    onAssetSelectorClick: "asset-selector-click" as EventName<CustomEvent>,
  },
})

export const UigcAssetBalance = createComponent({
  tagName: "uigc-asset-balance",
  elementClass: UI.AssetBalance,
  react: React,
})

export const UigcButton = createComponent({
  tagName: "uigc-button",
  elementClass: UI.Button,
  react: React,
})

export function OrderAssetPay(props: {
  name?: string
  title?: string
  value: string
  asset: string | u32
  balance?: BN | undefined
  onChange?: (value: string) => void
  error?: string
  readonly?: boolean
}) {
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(props.asset.toString())

  const assetBalance = props.balance
  const assetDecimals = asset.decimals

  let blnc: string = ""
  if (assetBalance && assetDecimals) {
    blnc = assetBalance.shiftedBy(-1 * assetDecimals).toFixed()
  }

  return (
    <UigcAssetTransfer
      ref={(el) => {
        if (!el) {
          return
        }
        props.readonly && el.setAttribute("readonly", "")
        if (props.error) {
          el.setAttribute("error", props.error)
        } else {
          el.removeAttribute("error")
        }
      }}
      onAssetInputChange={(e) =>
        props.onChange && props.onChange(e.detail.value)
      }
      id={props.name}
      title={props.title}
      asset={asset.symbol}
      unit={asset.symbol}
      amount={props.value}
      selectable={false}
      readonly={props.readonly || false}
    >
      <UigcAsset slot="asset" symbol={asset?.symbol}>
        <UigcAssetId slot="icon" symbol={asset?.symbol} />
      </UigcAsset>
      <UigcAssetBalance slot="balance" balance={blnc} visible={false} />
    </UigcAssetTransfer>
  )
}

function getPercentageValue(value: BN, pct: number): BN {
  return value.div(100).multipliedBy(new BN(pct))
}

const OrderAssetPctBtn = (
  pct: number,
  remaining: BN,
  onClick: (value: string) => void,
) => (
  <UigcButton
    slot="button"
    onClick={() => {
      const res = getPercentageValue(remaining, pct)
      onClick(res.toFixed())
    }}
    {...{ variant: "max", size: "micro", nowrap: true }}
  >
    {pct + "%"}
  </UigcButton>
)

export function OrderAssetGet(props: {
  name?: string
  title?: string
  value: string
  remaining: BN
  asset: string | u32
  onChange?: (value: string) => void
  error?: string
  readonly?: boolean
}) {
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(props.asset.toString())
  return (
    <UigcAssetTransfer
      ref={(el) => {
        if (!el) {
          return
        }
        props.readonly && el.setAttribute("readonly", "")

        if (props.error) {
          el.setAttribute("error", props.error)
        } else {
          el.removeAttribute("error")
        }
      }}
      onAssetInputChange={(e) =>
        props.onChange && props.onChange(e.detail.value)
      }
      id={props.name}
      title={props.title}
      asset={asset.symbol}
      unit={asset.symbol}
      amount={props.value}
      selectable={false}
      readonly={props.readonly || false}
    >
      <UigcAsset slot="asset" symbol={asset?.symbol}>
        <UigcAssetId slot="icon" symbol={asset?.symbol} />
      </UigcAsset>
      {props.onChange && (
        <div slot="balance" sx={{ display: "flex", justify: "end", gap: 2 }}>
          {OrderAssetPctBtn(25, props.remaining, props.onChange)}
          {OrderAssetPctBtn(50, props.remaining, props.onChange)}
          {OrderAssetPctBtn(75, props.remaining, props.onChange)}
          {OrderAssetPctBtn(100, props.remaining, props.onChange)}
        </div>
      )}
    </UigcAssetTransfer>
  )
}
