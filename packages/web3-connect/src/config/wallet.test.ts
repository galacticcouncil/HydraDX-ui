import { describe, expect, it } from "vitest"

import { WalletProviderType } from "@/config/providers"
import {
  chipModesForAccounts,
  getWalletChainModes,
  getWalletModesByProviderType,
  providersForMode,
  WALLET_MODES,
  WalletMode,
} from "@/config/wallet"

/**
 * Invariants over WALLET_MODES. They exist to catch the next half-added mode,
 * which is the shape of bug the registry was built to prevent.
 */
describe("WALLET_MODES invariants", () => {
  const chainEntries = Object.entries(WALLET_MODES).filter(
    ([, entry]) => entry.chain,
  )

  it("gives every chain mode a name and an icon", () => {
    for (const [mode, entry] of chainEntries) {
      if (!entry.chain) continue

      expect(entry.name, `${mode} name`).not.toBe("")
      expect(entry.icon, `${mode} icon`).not.toBe("")
    }
  })

  it("assigns every wallet provider to at least one mode", () => {
    /**
     * Providers that belong to no mode on purpose: ExternalWallet is a
     * read-only address the user types in, and Multisig is derived from other
     * accounts. Neither is a chain-specific wallet the mode filter can offer,
     * so both sit outside the registry. The list is asserted rather than
     * skipped so that adding a third exclusion is a deliberate act.
     */
    const EXPECTED_EXCLUSIONS = [
      WalletProviderType.ExternalWallet,
      WalletProviderType.Multisig,
    ]

    const assigned = new Set(
      Object.values(WALLET_MODES).flatMap((entry) => entry.providers),
    )

    const unassigned = Object.values(WalletProviderType).filter(
      (provider) => !assigned.has(provider),
    )

    expect(unassigned).toEqual(EXPECTED_EXCLUSIONS)
  })
})

describe("chipModesForAccounts", () => {
  const account = (provider: WalletProviderType) => ({ provider })

  it("returns no chips for an empty account list", () => {
    expect(chipModesForAccounts([])).toEqual([])
  })

  it("returns no chips when every account is in one mode", () => {
    expect(
      chipModesForAccounts([
        account(WalletProviderType.PolkadotJS),
        account(WalletProviderType.Talisman),
      ]),
    ).toEqual([])
  })

  it("prepends the All chip once two modes have accounts", () => {
    expect(
      chipModesForAccounts([
        account(WalletProviderType.PolkadotJS),
        account(WalletProviderType.MetaMask),
      ]),
    ).toEqual([WalletMode.Default, WalletMode.Substrate, WalletMode.EVM])
  })

  it("lists three modes in registry order", () => {
    expect(
      chipModesForAccounts([
        account(WalletProviderType.Phantom),
        account(WalletProviderType.MetaMask),
        account(WalletProviderType.Subwallet),
      ]),
    ).toEqual([
      WalletMode.Default,
      WalletMode.Substrate,
      WalletMode.EVM,
      WalletMode.Solana,
    ])
  })

  it("excludes ExternalWallet accounts from the computation", () => {
    expect(
      chipModesForAccounts([
        account(WalletProviderType.PolkadotJS),
        account(WalletProviderType.ExternalWallet),
      ]),
    ).toEqual([])

    expect(
      chipModesForAccounts([account(WalletProviderType.ExternalWallet)]),
    ).toEqual([])
  })
})

describe("providersForMode", () => {
  it("does not restrict the Default mode", () => {
    expect(providersForMode(WalletMode.Default)).toBeNull()
  })

  it("restricts a chain mode to that chain's providers", () => {
    expect(providersForMode(WalletMode.Solana)).toEqual(
      WALLET_MODES[WalletMode.Solana].providers,
    )
    // The regression this whole candidate exists for: Sui and H160 were
    // stripped from the wallet list before the forced mode was consulted.
    expect(providersForMode(WalletMode.Sui)).toContain(WalletProviderType.Suiet)
    expect(providersForMode(WalletMode.SubstrateH160)).toContain(
      WalletProviderType.TalismanH160,
    )
  })

  it("does not restrict a chain mode that has no providers yet", () => {
    expect(providersForMode(WalletMode.Near)).toBeNull()
    expect(providersForMode(WalletMode.Zcash)).toBeNull()
  })
})

describe("getWalletChainModes", () => {
  it("answers which chain a provider signs for, not which lists hold it", () => {
    expect(getWalletChainModes(WalletProviderType.PolkadotJS)).toEqual([
      WalletMode.Substrate,
    ])
    expect(getWalletChainModes(WalletProviderType.MetaMask)).toEqual([
      WalletMode.EVM,
    ])
    expect(getWalletChainModes(WalletProviderType.Phantom)).toEqual([
      WalletMode.Solana,
    ])
  })

  it("returns both chains for a provider that spans them", () => {
    // WalletConnect is the only member of both the substrate and EVM lists.
    expect(getWalletChainModes(WalletProviderType.WalletConnect)).toEqual([
      WalletMode.Substrate,
      WalletMode.EVM,
    ])
  })

  /**
   * The regression this exists for: callers used to take the first non-Default
   * mode, which is the composite SubstrateEVM for every substrate and EVM
   * provider - so those accounts silently rendered no chain icon.
   */
  it("drops the composites the raw lookup returns", () => {
    const raw = getWalletModesByProviderType(WalletProviderType.PolkadotJS)

    expect(raw).toContain(WalletMode.Default)
    expect(raw).toContain(WalletMode.SubstrateEVM)
    expect(getWalletChainModes(WalletProviderType.PolkadotJS)).not.toContain(
      WalletMode.SubstrateEVM,
    )
  })
})
