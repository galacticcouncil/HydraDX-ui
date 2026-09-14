import { METADATA_CDN_URL } from "@galacticcouncil/utils"

import {
  EVM_PROVIDERS,
  SOLANA_PROVIDERS,
  SUBSTRATE_H160_PROVIDERS,
  SUBSTRATE_PROVIDERS,
  SUI_PROVIDERS,
  WalletProviderType,
} from "@/config/providers"

export const WALLET_DAPP_NAME = "Hydration"

export const REOWN_PROJECT_ID = "265a3fea03b46c14a46a201fbd6c552e"

export enum WalletProviderStatus {
  Connected = "connected",
  Pending = "pending",
  Disconnected = "disconnected",
  Error = "error",
}

export enum WalletMode {
  Default = "default",
  EVM = "evm",
  Substrate = "substrate",
  SubstrateEVM = "substrate-evm",
  SubstrateH160 = "substrate-h160",
  Solana = "solana",
  Sui = "sui",
  Near = "near",
  Zcash = "zcash",
}

export const WALLET_ACCOUNT_FILTER_OPTIONS = [
  WalletMode.Substrate,
  WalletMode.SubstrateH160,
  WalletMode.EVM,
  WalletMode.Solana,
  WalletMode.Sui,
  WalletMode.Near,
  WalletMode.Zcash,
] as const satisfies Array<WalletMode>

export type WalletAccountFilterOptionOverride =
  (typeof WALLET_ACCOUNT_FILTER_OPTIONS)[number]

export type WalletAccountFilterOption =
  | WalletAccountFilterOptionOverride
  | WalletMode.Default

/**
 * Every fact about a wallet mode lives here. Adding a mode is one edit.
 *
 * Chain modes map to a single chain and so carry a display name and icon.
 * Composite modes (Default, SubstrateEVM) span several chains and have
 * neither - the union is discriminated on `chain` so reading `.icon` off a
 * composite entry is a type error.
 *
 */

type ChainModeEntry = {
  chain: true
  name: string
  icon: string
  providers: WalletProviderType[]
}

type CompositeModeEntry = {
  chain: false
  providers: WalletProviderType[]
}

/**
 * The union of substrate and EVM providers, de-duplicated: WalletConnect is a
 * member of both lists, and the pre-registry tables carried it twice.
 */
const SUBSTRATE_EVM_PROVIDERS: WalletProviderType[] = [
  ...new Set([...SUBSTRATE_PROVIDERS, ...EVM_PROVIDERS]),
]

export const WALLET_MODES: Record<
  WalletMode,
  ChainModeEntry | CompositeModeEntry
> = {
  [WalletMode.Default]: {
    chain: false,
    providers: SUBSTRATE_EVM_PROVIDERS,
  },
  [WalletMode.SubstrateEVM]: {
    chain: false,
    providers: SUBSTRATE_EVM_PROVIDERS,
  },
  [WalletMode.Substrate]: {
    chain: true,
    name: "Polkadot",
    icon: `${METADATA_CDN_URL}/v2/polkadot/2034/assets/5/icon.svg`,
    providers: SUBSTRATE_PROVIDERS,
  },
  [WalletMode.SubstrateH160]: {
    chain: true,
    name: "Substrate H160",
    icon: `${METADATA_CDN_URL}/v2/polkadot/2034/assets/5/icon.svg`,
    providers: SUBSTRATE_H160_PROVIDERS,
  },
  [WalletMode.EVM]: {
    chain: true,
    name: "EVM",
    icon: `${METADATA_CDN_URL}/v2/ethereum/1/icon.svg`,
    providers: EVM_PROVIDERS,
  },
  [WalletMode.Solana]: {
    chain: true,
    name: "Solana",
    icon: `${METADATA_CDN_URL}/v2/solana/101/icon.svg`,
    providers: SOLANA_PROVIDERS,
  },
  [WalletMode.Sui]: {
    chain: true,
    name: "Sui",
    icon: `${METADATA_CDN_URL}/v2/polkadot/2034/assets/1000753/icon.svg`,
    providers: SUI_PROVIDERS,
  },
  [WalletMode.Near]: {
    chain: true,
    name: "NEAR",
    icon: `${METADATA_CDN_URL}/v2/near/near/icon.svg`,
    providers: [],
  },
  [WalletMode.Zcash]: {
    chain: true,
    name: "Zcash",
    icon: `${METADATA_CDN_URL}/v2/zcash/zec/icon.svg`,
    providers: [],
  },
}

/**
 * Which wallet providers may be offered for each mode. Derived from the
 * registry - do not restate the lists here.
 *
 * Re-exported from `@/hooks/useWeb3Connect`, which is where every call site
 * still imports it from.
 */
export const PROVIDERS_BY_WALLET_MODE: Record<
  WalletMode,
  WalletProviderType[]
> = Object.fromEntries(
  Object.entries(WALLET_MODES).map(([mode, entry]) => [mode, entry.providers]),
) as Record<WalletMode, WalletProviderType[]>

/**
 * The providers a forced mode restricts the modal to, or `null` for no
 * restriction.
 *
 * `null` covers two distinct cases that behave identically: Default, where no
 * chain has been singled out and every wallet is connectable; and a chain mode
 * with no connectors yet (Near, Zcash), where filtering would leave the modal
 * empty rather than merely narrow.
 */
export const providersForMode = (
  mode: WalletMode,
): WalletProviderType[] | null => {
  if (mode === WalletMode.Default) return null
  const providers = WALLET_MODES[mode].providers
  return providers.length ? providers : null
}

/**
 * The providers usable when no chain has been singled out - i.e. the Default
 * mode's list.
 */
export const COMPATIBLE_WALLET_PROVIDERS: WalletProviderType[] =
  WALLET_MODES[WalletMode.Default].providers

/**
 * Display name for a chain mode. Composite modes span several chains and have
 * none, which callers render as an empty string.
 */
export const getWalletModeName = (
  mode: WalletAccountFilterOptionOverride,
): string => {
  const entry = WALLET_MODES[mode]
  // Every account-filter mode is a chain mode; the guard is for the type only.
  return entry.chain ? entry.name : ""
}

export function getWalletModeIcon(mode: WalletMode): string {
  const entry = WALLET_MODES[mode]
  return entry.chain ? entry.icon : ""
}

/**
 * Every mode a provider appears under, composites included. A substrate
 * provider comes back as Default, SubstrateEVM and Substrate.
 *
 * Callers that want "which chain is this?" want `getWalletChainModes` instead
 * - the composites in here are the table's shape, not an answer.
 */
export function getWalletModesByProviderType(
  walletType: WalletProviderType,
): WalletMode[] {
  return Object.entries(PROVIDERS_BY_WALLET_MODE)
    .filter(([, providers]) => providers.includes(walletType))
    .map(([mode]) => mode as WalletMode)
}

/**
 * The chains a provider actually signs for. Composite modes are dropped, so
 * every mode returned has a name and an icon.
 *
 * Usually one. WalletConnect is the exception - it belongs to both the
 * substrate and EVM lists and comes back with both.
 */
export function getWalletChainModes(
  walletType: WalletProviderType,
): WalletMode[] {
  return getWalletModesByProviderType(walletType).filter(
    (mode) => WALLET_MODES[mode].chain,
  )
}

/**
 * The account-filter chips to render for a given list of accounts.
 *
 * The chip set is derived from the accounts on screen rather than stored,
 * which is why the registry carries no `filterable` field: a mode earns a chip
 * by having at least one account behind it, and loses it when that account
 * disconnects.
 *
 * Below two modes there are no chips at all - a filter that cannot change what
 * is displayed is noise - and the caller leaves its filter on
 * `WalletMode.Default`. At two or more, the All chip is prepended.
 *
 * ExternalWallet accounts are deliberately EXCLUDED from the computation. They
 * carry no provider-to-mode relationship, and the alternative - classifying
 * them by address shape, as `filterAccounts` does - would mean importing the
 * address validators into this module, whose near-zero import surface is what
 * lets leaf modules read the registry without pulling in heavy SDK/wasm deps.
 * Consequence: a watched-address-only account list renders no chips.
 */
export const chipModesForAccounts = (
  accounts: Array<{ provider: WalletProviderType }>,
): WalletAccountFilterOption[] => {
  const modes = WALLET_ACCOUNT_FILTER_OPTIONS.filter((mode) =>
    accounts.some(
      (account) =>
        account.provider !== WalletProviderType.ExternalWallet &&
        WALLET_MODES[mode].providers.includes(account.provider),
    ),
  )

  if (modes.length < 2) return []

  return [WalletMode.Default, ...modes]
}
