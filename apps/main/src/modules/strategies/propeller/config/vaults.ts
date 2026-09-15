import { type FileRouteTypes } from "@tanstack/react-router"
import { type Hex } from "viem"

export type PropellerAsset = "eth" | "tbtc"

export interface PropellerVaultConfig {
  key: PropellerAsset
  assetId: string
  assetAddress: Hex
  vaultAddress: Hex
  symbol: string
  shareSymbol: string
}

export const PROPELLER_VAULTS: Record<PropellerAsset, PropellerVaultConfig> = {
  eth: {
    key: "eth",
    assetId: "34",
    assetAddress: "0x0000000000000000000000000000000100000022",
    vaultAddress: "0x3645E7013C00d91D9E6c3EA3847E586967d8fc67",
    symbol: "ETH",
    shareSymbol: "pETH",
  },
  tbtc: {
    key: "tbtc",
    assetId: "1000765",
    assetAddress: "0x00000000000000000000000000000001000f453d",
    vaultAddress: "0x22fff20f7f4a7047f6975248aeafc2f013ae76cf",
    symbol: "tBTC",
    shareSymbol: "ptBTC",
  },
}

/** Resolves to strategy.risk.<level> in the propeller i18n namespace. */
export const PROPELLER_RISK_PROFILE = "low"

export const PROPELLER_VAULT_ROUTE: Record<
  PropellerAsset,
  FileRouteTypes["to"]
> = {
  eth: "/strategies/propeller-eth",
  tbtc: "/strategies/propeller-tbtc",
}
