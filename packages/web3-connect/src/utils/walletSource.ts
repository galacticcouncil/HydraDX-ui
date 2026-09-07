import { uniqueBy } from "remeda"

import {
  SUBSTRATE_H160_PROVIDERS,
  WalletProviderType,
} from "@/config/providers"
import { getWalletChainModes, WALLET_MODES, WalletMode } from "@/config/wallet"

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

const RECENT_GROUPS_LIMIT = 5

const NOT_RECENT = Number.MAX_SAFE_INTEGER

const getRecentRank = <T extends WalletSourceLike>(
  group: WalletSourceGroup<T>,
  recentlyUsedProviders: WalletProviderType[],
) =>
  Math.min(
    ...group.providers.map((provider) => {
      const index = recentlyUsedProviders.indexOf(provider)
      return index === -1 ? NOT_RECENT : index
    }),
  )

export const selectWalletSources = <T extends WalletSourceLike>(
  wallets: T[],
  modeProviders: WalletProviderType[] | null,
  connectedProviderTypes: WalletProviderType[],
  recentlyUsedProviders: WalletProviderType[] = [],
) => {
  const available = wallets.filter(
    (wallet) =>
      wallet.provider !== WalletProviderType.ExternalWallet &&
      (modeProviders
        ? modeProviders.includes(wallet.provider)
        : !SUBSTRATE_H160_PROVIDERS.includes(wallet.provider) ||
          connectedProviderTypes.includes(wallet.provider)),
  )

  const groups = groupWalletsBySource(available)

  const isGroupReachable = (group: WalletSourceGroup<T>) =>
    group.wallets.some((wallet) => isReachable(wallet, connectedProviderTypes))

  const isGroupConnected = (group: WalletSourceGroup<T>) =>
    group.providers.some((provider) =>
      connectedProviderTypes.includes(provider),
    )

  const byTitle = (a: WalletSourceGroup<T>, b: WalletSourceGroup<T>) =>
    a.title.localeCompare(b.title)

  const rankOf = (group: WalletSourceGroup<T>) =>
    getRecentRank(group, recentlyUsedProviders)

  const reachableGroups = groups.filter(isGroupReachable)

  const recentGroups = reachableGroups
    .filter((group) => isGroupConnected(group) || rankOf(group) !== NOT_RECENT)
    .sort(
      (a, b) =>
        Number(isGroupConnected(b)) - Number(isGroupConnected(a)) ||
        rankOf(a) - rankOf(b) ||
        byTitle(a, b),
    )
    .slice(0, RECENT_GROUPS_LIMIT)

  const installedGroups = reachableGroups
    .filter((group) => !recentGroups.includes(group))
    .sort(byTitle)

  const otherGroups = groups
    .filter((group) => !isGroupReachable(group))
    .sort((a, b) => a.title.localeCompare(b.title))

  return { available, recentGroups, installedGroups, otherGroups }
}
