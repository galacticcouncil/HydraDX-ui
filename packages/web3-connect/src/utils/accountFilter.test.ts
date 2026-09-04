import { describe, expect, it } from "vitest"

import { WalletProviderType } from "@/config/providers"
import { WalletMode } from "@/config/wallet"
import type { Account } from "@/hooks/useWeb3Connect"
import {
  filterAccounts,
  getFilteredAccounts,
  isAccountSelected,
} from "@/utils/accountFilter"

const account = (
  provider: WalletProviderType,
  address: string,
  name = "",
): Account => ({
  name,
  address,
  rawAddress: address,
  displayAddress: address,
  publicKey: "",
  provider,
  canUseOnHydration: true,
})

const SS58 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
// The same shape a watched EVM address is stored in: an H160 encoded as SS58.
const SS58_H160 = "7KATdGb3RBK8sCDiavr7XsV3ARacKm6HRLqcnmeB3rJZkRoA"

const POLKADOT = account(WalletProviderType.PolkadotJS, SS58, "Alice")
const METAMASK = account(WalletProviderType.MetaMask, SS58_H160, "Bob")
const PHANTOM = account(WalletProviderType.Phantom, SS58, "Carol")

const watched = (address: string) =>
  account(WalletProviderType.ExternalWallet, address, "Watched")

const providers = (accounts: Account[]) => accounts.map((a) => a.provider)

describe("filterAccounts", () => {
  const all = [POLKADOT, METAMASK, PHANTOM]

  it("passes everything through in Default mode", () => {
    expect(filterAccounts(WalletMode.Default)(all)).toEqual(all)
  })

  it("keeps only the mode's providers", () => {
    expect(providers(filterAccounts(WalletMode.EVM)(all))).toEqual([
      WalletProviderType.MetaMask,
    ])
    expect(providers(filterAccounts(WalletMode.Solana)(all))).toEqual([
      WalletProviderType.Phantom,
    ])
  })

  /**
   * A watched address has no provider to match on, so it is classified by the
   * shape of the address instead. The two substrate-looking forms are the
   * interesting pair: an H160-derived account decodes as valid SS58 too, so
   * matching on SS58 alone would show it under Polkadot as well as EVM.
   */
  describe("external (watched) addresses", () => {
    const both = [watched(SS58), watched(SS58_H160)]

    it("shows only the EVM-derived address under EVM", () => {
      expect(filterAccounts(WalletMode.EVM)(both)).toEqual([watched(SS58_H160)])
    })

    it("shows only the plain SS58 address under Substrate", () => {
      expect(filterAccounts(WalletMode.Substrate)(both)).toEqual([
        watched(SS58),
      ])
    })

    it("keeps a watched address under a mode with no address test", () => {
      expect(filterAccounts(WalletMode.Solana)(both)).toEqual(both)
    })
  })
})

describe("isAccountSelected", () => {
  it("requires both the address and the provider to match", () => {
    expect(isAccountSelected(POLKADOT, POLKADOT)).toBe(true)
    // Same address, connected through a different wallet: a different account.
    expect(isAccountSelected(POLKADOT, PHANTOM)).toBe(false)
  })

  it("is false when either side is absent", () => {
    expect(isAccountSelected(null, POLKADOT)).toBe(false)
    expect(isAccountSelected(POLKADOT, null)).toBe(false)
  })
})

describe("getFilteredAccounts", () => {
  const all = [POLKADOT, METAMASK, PHANTOM]

  it("floats the current account to the top", () => {
    const result = getFilteredAccounts(all, PHANTOM, "", WalletMode.Default)

    expect(providers(result)).toEqual([
      WalletProviderType.Phantom,
      WalletProviderType.PolkadotJS,
      WalletProviderType.MetaMask,
    ])
  })

  it("applies the search and the mode together", () => {
    expect(getFilteredAccounts(all, null, "Bob", WalletMode.EVM)).toEqual([
      METAMASK,
    ])

    // Bob is the EVM account, so the substrate mode leaves nothing.
    expect(getFilteredAccounts(all, null, "Bob", WalletMode.Substrate)).toEqual(
      [],
    )
  })

  it("returns everything when the search is empty", () => {
    expect(getFilteredAccounts(all, null, "", WalletMode.Default)).toHaveLength(
      3,
    )
  })
})
