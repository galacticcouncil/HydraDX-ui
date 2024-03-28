import * as React from "react"
import { createComponent } from "@lit-labs/react"
import {
  AssetId,
  ChainLogo as ChainLogoUi,
  PlaceholderLogo,
} from "@galacticcouncil/ui"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import {
  SLogoContainer,
  SWarningIconContainer,
  assetPlaceholderCss,
} from "./AssetIcon.styled"
import { useMemo } from "react"
import { useRpcProvider } from "providers/rpcProvider"
import WarningIcon from "assets/icons/WarningIcon.svg?react"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { useTranslation } from "react-i18next"

const chains = Array.from(chainsMap.values())

export const UigcAssetPlaceholder = createComponent({
  tagName: "uigc-logo-placeholder",
  elementClass: PlaceholderLogo,
  react: React,
})

export const UigcAssetId = createComponent({
  tagName: "uigc-asset-id",
  elementClass: AssetId,
  react: React,
})

export const UigcChainLogo = createComponent({
  tagName: "uigc-logo-chain",
  elementClass: ChainLogoUi,
  react: React,
})

export function getAssetName(symbol: string | null | undefined) {
  const _symbol = symbol?.toUpperCase()

  if (_symbol === "AUSD") return "Acala Dollar"
  if (_symbol === "BSX") return "Basilisk"
  if (_symbol === "KAR") return "Karura"
  if (_symbol === "KSM") return "Kusama"
  if (_symbol === "PHA") return "Phala"
  if (_symbol === "TNKR") return "Tinkernet"
  if (_symbol === "HDX") return "HydraDX"
  if (_symbol === "LRNA") return "Lerna"
  if (_symbol === "DAI") return "Dai"
  if (_symbol === "DOT") return "Polkadot"
  if (_symbol === "BTC") return "Bitcoin"
  if (_symbol === "ETH") return "Ethereum"
  if (_symbol === "USDC") return "USD Coin"
  if (_symbol === "USDT") return "Tether"
  if (_symbol === "APE") return "ApeCoin"
  if (_symbol === "ASTR") return "Astar"
  if (_symbol === "IBTC") return "interBTC"

  return "N/A"
}

export const AssetLogo = ({ id }: { id?: string }) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const asset = useMemo(() => {
    const assetDetails = id ? assets.getAsset(id) : undefined

    const chain = chains.find(
      (chain) => chain.parachainId === Number(assetDetails?.parachainId),
    )

    return {
      chain: chain?.key,
      symbol: assetDetails?.symbol,
      isExternal: assetDetails?.isExternal,
    }
  }, [assets, id])

  if (asset.chain || asset.symbol)
    return (
      <SLogoContainer>
        <UigcAssetId
          css={{ "& uigc-logo-chain": { display: "none" } }}
          ref={(el) => {
            el && asset.chain && el.setAttribute("chain", asset.chain)
            el && el.setAttribute("fit", "")
          }}
          symbol={asset.symbol}
          chain={asset?.chain}
        />
        {asset?.isExternal && (
          <InfoTooltip text={t("wallet.addToken.tooltip.warning")} asChild>
            <SWarningIconContainer>
              <WarningIcon />
            </SWarningIconContainer>
          </InfoTooltip>
        )}
      </SLogoContainer>
    )

  return (
    <UigcAssetPlaceholder
      css={assetPlaceholderCss}
      ref={(el) => el && el.setAttribute("fit", "")}
      slot="placeholder"
    />
  )
}

export const ChainLogo = ({ symbol }: { symbol?: string }) => {
  return (
    <UigcChainLogo
      chain={symbol}
      ref={(el) => el && el.setAttribute("fit", "")}
    >
      <UigcAssetPlaceholder
        css={assetPlaceholderCss}
        ref={(el) => el && el.setAttribute("fit", "")}
        slot="placeholder"
      />
    </UigcChainLogo>
  )
}
