import PoolsAndFarmsIcon from "assets/icons/PoolsAndFarms.svg?react"
import TradeIcon from "assets/icons/Trade.svg?react"
import TransferIcon from "assets/icons/TransferTabIcon.svg?react"
import WalletIcon from "assets/icons/Wallet.svg?react"
import IconDCA from "assets/icons/navigation/IconDCA.svg?react"
import IconOTC from "assets/icons/navigation/IconOTC.svg?react"
import IconSwap from "assets/icons/navigation/IconSwap.svg?react"
import StatsIcon from "assets/icons/ChartIcon.svg?react"
import StakingIcon from "assets/icons/StakingIcon.svg?react"
import IconBonds from "assets/icons/Bonds.svg?react"
import ChainlinkIcon from "assets/icons/ChainlinkIcon.svg?react"
import RocketIcon from "assets/icons/RocketIcon.svg?react"
import IconYieldDCA from "assets/icons/YieldDcaIcon.svg?react"
import { Search } from "@tanstack/react-location"

export const LINKS = {
  home: "/",
  liquidity: "/liquidity",
  myLiquidity: "/liquidity/my-liquidity",
  allPools: "/liquidity/all-pools",
  omnipool: "/liquidity/omnipool-stablepools",
  isolated: "/liquidity/isolated",
  lbp: "/liquidity/lbp",
  swap: "/trade/swap",
  wallet: "/wallet",
  walletAssets: "/wallet/assets",
  walletTransactions: "/wallet/transactions",
  walletVesting: "/wallet/vesting",
  cross_chain: "/cross-chain",
  bridge: "/bridge",
  trade: "/trade",
  otc: "/trade/otc",
  dca: "/trade/dca",
  yieldDca: "/trade/yield-dca",
  bonds: "/trade/bonds",
  bond: "/trade/bond",
  stats: "/stats",
  statsOverview: "/stats/overview",
  statsPOL: "/stats/treasury",
  statsLRNA: "/stats/LRNA",
  statsOmnipool: "/stats/asset",
  staking: "/staking",
  stakingDashboard: "/staking/dashboard",
  stakingGovernance: "/staking/governance",
  referrals: "/referrals",
  memepad: "/memepad",
  submitTransaction: "/submit-transaction",
}

export const MENU_ITEMS = [
  {
    key: "trade",
    href: LINKS.swap,
    Icon: TradeIcon,
    subItems: [
      { key: "swap", href: LINKS.swap, Icon: IconSwap, enabled: true },
      { key: "dca", href: LINKS.dca, Icon: IconDCA, enabled: true },
      {
        key: "yieldDca",
        href: LINKS.yieldDca,
        Icon: IconYieldDCA,
        enabled: true,
      },
      { key: "otc", href: LINKS.otc, Icon: IconOTC, enabled: true },
      {
        key: "bonds",
        href: LINKS.bonds,
        Icon: IconBonds,
        enabled: true,
      },
    ],
    enabled: true,
    external: false,
    mobVisible: true,
    tabVisible: true,
    mobOrder: 1,
    asyncEnabled: false,
  },
  {
    key: "liquidity",
    href: LINKS.allPools,
    Icon: PoolsAndFarmsIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: true,
    tabVisible: true,
    mobOrder: 2,
    asyncEnabled: false,
  },
  {
    key: "wallet",
    href: LINKS.walletAssets,
    Icon: WalletIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: true,
    tabVisible: true,
    mobOrder: 0,
    asyncEnabled: false,
  },
  {
    key: "xcm",
    href: LINKS.cross_chain,
    Icon: TransferIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: false,
    tabVisible: false,
    mobOrder: 5,
    asyncEnabled: false,
  },
  {
    key: "stats",
    href: LINKS.statsOverview,
    Icon: StatsIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: false,
    tabVisible: true,
    mobOrder: 3,
    asyncEnabled: false,
  },
  {
    key: "staking",
    href: LINKS.staking,
    Icon: StakingIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: false,
    tabVisible: true,
    mobOrder: 4,
    asyncEnabled: false,
  },
  {
    key: "referrals",
    href: LINKS.referrals,
    Icon: ChainlinkIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: false,
    tabVisible: true,
    mobOrder: 6,
    asyncEnabled: true,
  },
  {
    key: "memepad",
    href: LINKS.memepad,
    Icon: RocketIcon,
    subItems: undefined,
    enabled: true,
    external: false,
    mobVisible: false,
    tabVisible: true,
    mobOrder: 7,
    asyncEnabled: false,
  },
] as const

export type TabKey = (typeof MENU_ITEMS)[number]["key"]
export type TabItem = (typeof MENU_ITEMS)[number]
export type TabSubItem = (typeof MENU_ITEMS)[number]["subItems"]
export type TabItemWithSubItems = TabItem & {
  subItems: NonNullable<TabSubItem>
}

export const resetSearchParams = <T>(searhParams: Partial<Search<T>>) => {
  const persistSearchParams = ["account", "referral"]

  const result: Record<string, T | undefined> = {}

  for (const key in searhParams) {
    result[key] = persistSearchParams.includes(key)
      ? searhParams[key]
      : undefined
  }

  return result
}
