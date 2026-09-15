import { type Hex } from "viem"

// Propeller vault, lark-4 testnet. On redeploy, update SUBLOOP_ADDRESS,
// VAULT_DEPLOY_BLOCK, and vaultAddress in vaults.ts.
// POOL_ADDRESS, HOLLAR_ADDRESS, and PRIME_ADDRESS are mainnet-mirrored on lark.

export const SUBLOOP_ADDRESS: Hex = "0x1e755ba323Dbfe80CAa1bDAe37255D6f18F38CE6"

// Log scan start block. lark-4 re-forked 2026-09-07; SubLoop code starts ~138983.
// Too low wastes time; too high truncates history.
export const VAULT_DEPLOY_BLOCK = 138900n

export const EVM_CALL_GAS = 2_000_000n

export const POOL_ADDRESS: Hex = "0x1b02E051683b5cfaC5929C25E84adb26ECf87B38"
export const PRIME_ADDRESS: Hex = "0x000000000000000000000000000000010000002B"
export const HOLLAR_ADDRESS: Hex = "0x531a654d1696ED52e7275A8cede955E82620f99a"

export const STRATEGY = {
  id: "propeller",
} as const
