import {
  EvmAddr,
  NearAddr,
  safeConvertSS58toPublicKey,
  SolanaAddr,
  Ss58Addr,
  SuiAddr,
  ZecAddr,
} from "@galacticcouncil/utils"

/**
 * Canonical dedup / savedBy key for an address across every supported chain.
 *
 * - H160 (EVM) -> the address itself
 * - SS58 (Substrate) -> the decoded public key
 * - Solana -> the address itself
 * - Sui -> the address itself
 * - anything else -> "" (falsy)
 *
 * Keys are stored case-preserved (base58 chains like Solana are
 * case-sensitive). Always compare two keys with `stringEquals` (case-insensitive
 * by default) — never `===` — so EVM checksum-case variants still match.
 *
 * Branching mirrors getWalletModeByAddress so the key is consistent with the
 * chainKey classification used elsewhere.
 *
 */
export const addressToPublicKey = (address: string): string => {
  switch (true) {
    case EvmAddr.isValid(address):
      return address
    case Ss58Addr.isValid(address):
      return safeConvertSS58toPublicKey(address)
    case SolanaAddr.isValid(address):
      return address
    case SuiAddr.isValid(address):
      return address
    case NearAddr.isValid(address):
      return address
    case ZecAddr.isValid(address):
      return address
    default:
      return ""
  }
}
