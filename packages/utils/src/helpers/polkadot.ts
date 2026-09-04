import { h160 } from "@galacticcouncil/common"
import { toHex } from "@polkadot-api/utils"
import { AccountId } from "polkadot-api"

import { SolanaAddr, SuiAddr } from "./address"
import { isH160Address, safeConvertH160toSS58 } from "./evm"
import { safeConvertSolanaAddressToSS58 } from "./solana"
import { safeConvertSuiAddressToSS58 } from "./sui"

const { H160, isEvmAddress } = h160

export const isBinary = (value: unknown): value is Uint8Array =>
  value instanceof Uint8Array

export const safeConvertAddressSS58 = (address: string, ss58prefix = 0) => {
  try {
    return AccountId(ss58prefix).dec(AccountId().enc(address))
  } catch {
    return ""
  }
}

export const safeConvertPublicKeyToSS58 = (
  publicKey: string,
  ss58prefix = 0,
) => {
  try {
    return AccountId(ss58prefix).dec(publicKey)
  } catch {
    return ""
  }
}

export const isSS58Address = (address?: string): address is string =>
  !!address && !!safeConvertAddressSS58(address)

export const safeConvertSS58toPublicKey = (address: string) => {
  try {
    return toHex(AccountId().enc(address))
  } catch {
    return ""
  }
}

export const normalizeSS58Address = (address: string) => {
  return isEvmAddress(address)
    ? safeConvertAddressSS58(H160.toAccount(address))
    : safeConvertAddressSS58(address)
}

/**
 * Canonical `0x` + 64 lowercase hex public key for any address form the app
 * renders (H160, Solana, Sui or SS58). Returns "" when unresolvable.
 */
export const accountPublicKey = (address: string): string => {
  if (!address) return ""

  if (isH160Address(address)) {
    return safeConvertSS58toPublicKey(safeConvertH160toSS58(address))
  }

  if (SolanaAddr.isValid(address)) {
    return safeConvertSS58toPublicKey(safeConvertSolanaAddressToSS58(address))
  }

  if (SuiAddr.isValid(address)) {
    return safeConvertSS58toPublicKey(safeConvertSuiAddressToSS58(address))
  }

  return safeConvertSS58toPublicKey(address)
}
