import { safeConvertAddressSS58 } from "@galacticcouncil/utils"
import { describe, expect, it } from "vitest"

import { addressToPublicKey } from "@/utils/publicKey"

const EVM = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
const SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const SUI = "0x00000000000000000000000000000000000000000000000000000000000000AB"
const NEAR = "alice.near"
// Checksum-valid t1 address — ZecAddr verifies base58check, not just the prefix.
const ZCASH = "t1dRJRY7GmyeykJnMH38mdQoaZtFhn1QmGz"

// //Alice, and the public key she is known to decode to.
const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const ALICE_PUBLIC_KEY =
  "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d"

// Keys are stored case-preserved (no lowercasing) on every branch.
describe("addressToPublicKey", () => {
  it("maps an EVM (H160) address to itself, case preserved", () => {
    expect(addressToPublicKey(EVM)).toBe(EVM)
  })

  it("decodes a Substrate (SS58) address to its public key", () => {
    expect(addressToPublicKey(ALICE)).toBe(ALICE_PUBLIC_KEY)
  })

  /**
   * The reason the function exists: one account, encoded under two chain
   * prefixes, is one dedup key. Comparing the SS58 strings would not match.
   */
  it("gives the same key for both SS58 encodings of one account", () => {
    const hydration = safeConvertAddressSS58(ALICE, 63)

    expect(hydration).not.toBe(ALICE)
    expect(addressToPublicKey(hydration)).toBe(ALICE_PUBLIC_KEY)
  })

  it("maps a Solana address to itself, not misclassified as SS58/EVM", () => {
    expect(addressToPublicKey(SOLANA)).toBe(SOLANA)
  })

  it("maps a Sui address to itself, case preserved", () => {
    expect(addressToPublicKey(SUI)).toBe(SUI)
  })

  // Both sit after Solana/Sui in the switch, so their branches are only
  // reached if the earlier validators correctly decline them.
  it("maps NEAR and Zcash addresses to themselves", () => {
    expect(addressToPublicKey(NEAR)).toBe(NEAR)
    expect(addressToPublicKey(ZCASH)).toBe(ZCASH)
  })

  // NEAR named account ids are arbitrary lowercase strings, so garbage has to
  // break that rule too (uppercase, spaces) to reach the default branch.
  it("returns a falsy key for unrecognised input", () => {
    expect(addressToPublicKey("NOT AN ADDRESS")).toBe("")
    expect(addressToPublicKey("")).toBe("")
  })
})
