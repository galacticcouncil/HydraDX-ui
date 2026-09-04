import { describe, expect, it } from "vitest"

import {
  SOLANA_PROVIDERS,
  SUBSTRATE_PROVIDERS,
  WalletProviderType,
} from "@/config/providers"
import { WalletMode } from "@/config/wallet"
import {
  getSelectableWallets,
  getWalletGroupSourceModes,
  getWalletSourceModeLabel,
  getWalletSourceModes,
  groupWalletsBySource,
  isWalletSourceGroupId,
  selectWalletSources,
  WalletSourceLike,
} from "@/utils/walletSource"

const wallet = (
  provider: WalletProviderType,
  title: string,
  installed = true,
): WalletSourceLike => ({ provider, title, logo: "", installed })

const TALISMAN = wallet(WalletProviderType.Talisman, "Talisman")
const TALISMAN_EVM = wallet(WalletProviderType.TalismanEvm, "Talisman")
const TALISMAN_SOL = wallet(WalletProviderType.TalismanSol, "Talisman")
const POLKADOT_JS = wallet(WalletProviderType.PolkadotJS, "Polkadot.js")
const PHANTOM = wallet(WalletProviderType.Phantom, "Phantom")
const NOT_INSTALLED = wallet(WalletProviderType.Enkrypt, "Enkrypt", false)

describe("groupWalletsBySource", () => {
  it("folds one brand's providers into a single source", () => {
    const [group, ...rest] = groupWalletsBySource([
      TALISMAN,
      POLKADOT_JS,
      TALISMAN_EVM,
    ])

    expect(group?.title).toBe("Talisman")
    expect(group?.providers).toEqual([
      WalletProviderType.Talisman,
      WalletProviderType.TalismanEvm,
    ])
    expect(rest.map((g) => g.title)).toEqual(["Polkadot.js"])
  })

  it("produces ids that isWalletSourceGroupId recognises", () => {
    const [group] = groupWalletsBySource([TALISMAN])
    expect(group && isWalletSourceGroupId(group.id)).toBe(true)
    expect(isWalletSourceGroupId(WalletProviderType.Talisman)).toBe(false)
    expect(isWalletSourceGroupId("all")).toBe(false)
  })
})

describe("selectWalletSources", () => {
  const all = [TALISMAN, TALISMAN_EVM, TALISMAN_SOL, POLKADOT_JS, PHANTOM]

  it("offers every wallet when no mode is forced", () => {
    const { available } = selectWalletSources(all, null, [])
    expect(available).toHaveLength(all.length)
  })

  it("narrows to the forced mode's providers", () => {
    const { available } = selectWalletSources(all, SOLANA_PROVIDERS, [])

    expect(available.map((w) => w.provider)).toEqual([
      WalletProviderType.TalismanSol,
      WalletProviderType.Phantom,
    ])
  })

  it("drops ExternalWallet, which renders in its own slot", () => {
    const external = wallet(WalletProviderType.ExternalWallet, "External")
    const { available } = selectWalletSources([TALISMAN, external], null, [])

    expect(available).toEqual([TALISMAN])
  })

  it("sorts connected sources first, then alphabetically", () => {
    const { sortedGroups } = selectWalletSources(
      [PHANTOM, POLKADOT_JS, TALISMAN],
      null,
      [WalletProviderType.Talisman],
    )

    expect(sortedGroups.map((g) => g.title)).toEqual([
      "Talisman",
      "Phantom",
      "Polkadot.js",
    ])
  })

  it("holds back sources that are neither installed nor connected", () => {
    const { sortedGroups, otherGroups } = selectWalletSources(
      [TALISMAN, NOT_INSTALLED],
      null,
      [],
    )

    expect(sortedGroups.map((g) => g.title)).toEqual(["Talisman"])
    expect(otherGroups.map((g) => g.title)).toEqual(["Enkrypt"])
  })

  it("promotes an uninstalled source once it is connected", () => {
    const { sortedGroups, otherGroups } = selectWalletSources(
      [NOT_INSTALLED],
      null,
      [WalletProviderType.Enkrypt],
    )

    expect(sortedGroups.map((g) => g.title)).toEqual(["Enkrypt"])
    expect(otherGroups).toEqual([])
  })
})

describe("getSelectableWallets", () => {
  it("keeps only wallets the user can act on", () => {
    const [group] = groupWalletsBySource([TALISMAN, NOT_INSTALLED])
    if (!group) throw new Error("expected a group")

    expect(getSelectableWallets(group, []).map((w) => w.provider)).toEqual([
      WalletProviderType.Talisman,
    ])
  })
})

describe("getWalletSourceModes", () => {
  it("badges a provider with its chain modes, never Default", () => {
    const modes = getWalletSourceModes(WalletProviderType.Phantom)

    expect(modes).toContain(WalletMode.Solana)
    expect(modes).not.toContain(WalletMode.Default)
  })

  it("omits composite modes, which carry no chain icon", () => {
    const modes = getWalletSourceModes(SUBSTRATE_PROVIDERS[0]!)

    expect(modes).not.toContain(WalletMode.SubstrateEVM)
    expect(modes).toContain(WalletMode.Substrate)
  })
})

describe("getWalletGroupSourceModes", () => {
  it("badges a brand's group with one entry per chain it covers", () => {
    const [group] = groupWalletsBySource([TALISMAN, TALISMAN_EVM, TALISMAN_SOL])
    if (!group) throw new Error("expected a group")

    expect(getWalletGroupSourceModes(group)).toEqual([
      WalletMode.Substrate,
      WalletMode.EVM,
      WalletMode.Solana,
    ])
  })
})

describe("getWalletSourceModeLabel", () => {
  it("names a chain mode", () => {
    expect(getWalletSourceModeLabel(WalletMode.Solana)).toBe("Solana")
  })

  it("falls back for composite and absent modes", () => {
    expect(getWalletSourceModeLabel(WalletMode.SubstrateEVM)).toBe("Wallet")
    expect(getWalletSourceModeLabel(undefined)).toBe("Wallet")
  })
})
