import { uniqueBy } from "remeda"

import { WalletProviderType } from "@/config/providers"
import { getWalletChainModes, WALLET_MODES, WalletMode } from "@/config/wallet"

/**
 * The wallet-source column's derivation, kept apart from the render.
 *
 * Everything here is pure and generic over the wallet shape, so it can be
 * exercised with plain objects - importing the real `Wallet` instances pulls
 * in extension detection that needs a browser. That was the missing seam: the
 * mode rules had no surface to be checked through, which is how two of them
 * shipped broken.
 *
 */
export type WalletSourceLike = {
  provider: WalletProviderType
  title: string
  logo: string
  installed: boolean
}

export type WalletSourceGroupId = `walletGroup:${string}`

export type WalletSourceId =
  | "all"
  | "recent"
  | WalletProviderType
  | WalletSourceGroupId

export type WalletSourceGroup<T extends WalletSourceLike> = {
  id: WalletSourceGroupId
  title: string
  logo?: string
  wallets: [T, ...T[]]
  providers: [WalletProviderType, ...WalletProviderType[]]
}

export const getWalletSourceGroupId = (
  wallet: WalletSourceLike,
): WalletSourceGroupId => `walletGroup:${wallet.title}`

export const isWalletSourceGroupId = (
  source: WalletSourceId,
): source is WalletSourceGroupId => source.startsWith("walletGroup:")

/**
 * One group per wallet brand. Talisman ships four providers (substrate, EVM,
 * H160, Solana) that the user thinks of as one wallet, so they are offered as
 * one source and the chain is picked afterwards.
 */
export const groupWalletsBySource = <T extends WalletSourceLike>(
  wallets: T[],
): WalletSourceGroup<T>[] => {
  const groups = new Map<WalletSourceGroupId, WalletSourceGroup<T>>()

  for (const wallet of wallets) {
    const id = getWalletSourceGroupId(wallet)
    const group = groups.get(id)

    if (group) {
      group.wallets.push(wallet)
      group.providers.push(wallet.provider)
      continue
    }

    groups.set(id, {
      id,
      title: wallet.title,
      logo: wallet.logo,
      wallets: [wallet],
      providers: [wallet.provider],
    })
  }

  return Array.from(groups.values())
}

/** The chain modes a provider is badged with. */
export const getWalletSourceModes = getWalletChainModes

export const getWalletGroupSourceModes = <T extends WalletSourceLike>(
  group: WalletSourceGroup<T>,
) =>
  uniqueBy(
    group.providers.flatMap((provider) => getWalletSourceModes(provider)),
    (walletMode) => walletMode,
  )

export const getWalletPrimaryMode = (provider: WalletProviderType) =>
  getWalletSourceModes(provider)[0]

export const getWalletSourceModeLabel = (mode?: WalletMode) => {
  const entry = mode ? WALLET_MODES[mode] : undefined
  // composite and absent modes have no chain name - they fall back to "Wallet"
  return entry?.chain ? entry.name : "Wallet"
}

/**
 * Within a group, only wallets the user can actually act on: installed, or
 * already connected. A group with one such wallet needs no chain picker.
 */
export const getSelectableWallets = <T extends WalletSourceLike>(
  group: WalletSourceGroup<T>,
  connectedProviderTypes: WalletProviderType[],
) =>
  group.wallets.filter(
    (wallet) =>
      wallet.installed || connectedProviderTypes.includes(wallet.provider),
  )

const isReachable = <T extends WalletSourceLike>(
  wallet: T,
  connectedProviderTypes: WalletProviderType[],
) => wallet.installed || connectedProviderTypes.includes(wallet.provider)

/**
 * The whole wallet-source column, derived in one place.
 *
 * `modeProviders` is the forced mode's gate - `null` means no restriction.
 * ExternalWallet is dropped because it renders in its own slot.
 *
 * Connected sources sort first, then alphabetically. Sources that are neither
 * installed nor connected fall to `otherGroups`, which the UI folds away.
 */
export const selectWalletSources = <T extends WalletSourceLike>(
  wallets: T[],
  modeProviders: WalletProviderType[] | null,
  connectedProviderTypes: WalletProviderType[],
) => {
  const available = wallets.filter(
    (wallet) =>
      wallet.provider !== WalletProviderType.ExternalWallet &&
      (!modeProviders || modeProviders.includes(wallet.provider)),
  )

  const groups = groupWalletsBySource(available)

  const byConnectedThenTitle = (a: boolean, b: boolean) =>
    a !== b ? (a ? -1 : 1) : 0

  const isGroupReachable = (group: WalletSourceGroup<T>) =>
    group.wallets.some((wallet) => isReachable(wallet, connectedProviderTypes))

  const sortedGroups = groups.filter(isGroupReachable).sort(
    (a, b) =>
      byConnectedThenTitle(
        a.providers.some((p) => connectedProviderTypes.includes(p)),
        b.providers.some((p) => connectedProviderTypes.includes(p)),
      ) || a.title.localeCompare(b.title),
  )

  const otherGroups = groups
    .filter((group) => !isGroupReachable(group))
    .sort((a, b) => a.title.localeCompare(b.title))

  return { available, sortedGroups, otherGroups }
}
