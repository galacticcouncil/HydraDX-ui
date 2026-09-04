import {
  ArrowRightLeftIcon,
  BanknoteIcon,
  BlocksIcon,
  ChartPieIcon,
  CoinsIcon,
  DropletIcon,
  DropletsIcon,
  GemIcon,
  GlassesIcon,
  GoalIcon,
  Grid2X2Icon,
  HDXClassic,
  HistoryIcon,
  Repeat2Icon,
  WalletIcon,
  WavesIcon,
} from "@galacticcouncil/ui/assets/icons"
import { neckwork } from "@galacticcouncil/utils"
import { TFunction } from "i18next"

import { FileRouteTypes } from "@/routeTree.gen"
import { getDeployPreviewId } from "@/utils/deploy"

type Route = FileRouteTypes["to"]

export const LINKS = {
  home: "/",
  liquidity: "/liquidity",
  myLiquidity: "/liquidity",
  pools: "/liquidity",
  swap: "/trade/swap",
  swapMarket: "/trade/swap/market",
  swapDca: "/trade/swap/dca",
  portfolio: "/portfolio",
  portfolioOverview: "/portfolio",
  portfolioTracked: "/portfolio/tracked",
  crossChain: "/cross-chain",
  crossChainHistory: "/cross-chain/history",
  // bridge: "/bridge",
  trade: "/trade",
  otc: "/trade/otc",
  staking: "/staking",
  stakingOld: "/staking-old",
  stakingGigaStake: "/staking",
  //governance: "/governance",
  // stakingGovernance: "/staking/governance",
  // referrals: "/referrals",
  borrow: "/borrow",
  borrowDashboard: "/borrow/dashboard",
  borrowMarkets: "/borrow/markets",
  borrowHistory: "/borrow/history",
  stats: "/stats",
  statsOverview: "/stats/overview",
  statsTreasury: "/stats/treasury",
  statsMoneyMarket: "/stats/money-market",
  statsHollar: "/stats/hollar",
  statsFees: "/stats/fees",
  statsAmm: "/stats/amm",
  deposit: "/deposit",
  withdraw: "/withdraw",
  // memepad: "/memepad",
  strategies: "/strategies",
  strategiesBil: "/strategies/bil-vault",
  strategiesHollarBonds: "/strategies/hollar-bonds",
  submitTransaction: "/submit-transaction",
} satisfies Record<string, Route>

export const EXTERNAL_LINKS = {
  explorer: neckwork.base,
} as const

export type ExternalNavigationKey = keyof typeof EXTERNAL_LINKS
export type NavigationKey = keyof typeof LINKS | ExternalNavigationKey

type NavigationItemCommon = {
  icon?: React.ComponentType
  enabled?: boolean
  defaultChild?: Route
  search?: Record<string, string | boolean>
  exact?: boolean
}

export type InternalNavigationItem = NavigationItemCommon & {
  key: Exclude<NavigationKey, ExternalNavigationKey>
  to: Route
  href?: never
  children?: InternalNavigationItem[]
}

export type ExternalNavigationItem = NavigationItemCommon & {
  key: ExternalNavigationKey
  href: string
  to?: never
  children?: never
}

export type NavigationItem = InternalNavigationItem | ExternalNavigationItem

export const NAVIGATION: NavigationItem[] = [
  {
    key: "trade",
    to: LINKS.trade,
    defaultChild: LINKS.swapMarket,
    icon: Repeat2Icon,
    children: [
      {
        key: "swap",
        to: LINKS.swap,
        icon: Repeat2Icon,
        children: [
          { key: "swapMarket", to: LINKS.swapMarket },
          { key: "swapDca", to: LINKS.swapDca },
        ],
      },
      { key: "otc", to: LINKS.otc, icon: CoinsIcon },
    ],
  },
  {
    key: "borrow",
    to: LINKS.borrow,
    defaultChild: LINKS.borrowDashboard,
    icon: BanknoteIcon,
    children: [
      { key: "borrowDashboard", to: LINKS.borrowDashboard, icon: ChartPieIcon },
      { key: "borrowMarkets", to: LINKS.borrowMarkets, icon: Grid2X2Icon },
      { key: "borrowHistory", to: LINKS.borrowHistory, icon: HistoryIcon },
    ],
  },
  {
    key: "strategies",
    to: LINKS.strategies,
    icon: CoinsIcon,
    children: [
      { key: "strategiesBil", to: LINKS.strategiesBil, icon: GoalIcon },
      {
        key: "strategiesHollarBonds",
        to: LINKS.strategiesHollarBonds,
        icon: GoalIcon,
      },
    ],
  },
  {
    key: "liquidity",
    to: LINKS.liquidity,
    icon: DropletIcon,
    children: [
      {
        key: "myLiquidity",
        to: LINKS.liquidity,
        icon: DropletsIcon,
        search: { myLiquidity: true },
      },
      {
        key: "pools",
        to: LINKS.liquidity,
        search: { myLiquidity: false },
        icon: WavesIcon,
      },
    ],
  },
  {
    key: "portfolio",
    to: LINKS.portfolio,
    icon: WalletIcon,
    defaultChild: LINKS.portfolio,
    children: [
      {
        key: "portfolioOverview",
        to: LINKS.portfolioOverview,
        exact: true,
        icon: WalletIcon,
      },
      {
        key: "portfolioTracked",
        to: LINKS.portfolioTracked,
        icon: GlassesIcon,
      },
    ],
  },
  {
    key: "crossChain",
    to: LINKS.crossChain,
    icon: ArrowRightLeftIcon,
    children: [
      {
        key: "crossChainHistory",
        to: LINKS.crossChainHistory,
        icon: HistoryIcon,
      },
    ],
  },
  {
    key: "stats",
    to: LINKS.stats,
    defaultChild: LINKS.statsFees,
    icon: ChartPieIcon,
    children: [
      // { key: "statsOverview", to: LINKS.statsOverview },
      // { key: "statsTreasury", to: LINKS.statsTreasury },
      // { key: "statsMoneyMarket", to: LINKS.statsMoneyMarket },
      // { key: "statsHollar", to: LINKS.statsHollar },
      // { key: "statsAmm", to: LINKS.statsAmm },
      { key: "statsFees", to: LINKS.statsFees },
    ],
  },
  {
    key: "staking",
    to: LINKS.staking,
    icon: GemIcon,
    children: [
      {
        key: "stakingGigaStake",
        to: LINKS.staking,
        icon: HDXClassic,
      },
      { key: "stakingOld", to: LINKS.stakingOld, icon: ChartPieIcon },
    ],
  },
  {
    key: "explorer",
    href: EXTERNAL_LINKS.explorer,
    icon: BlocksIcon,
  },
]

export const getMenuTranslations = (t: TFunction) =>
  ({
    home: {
      title: t("navigation.home.title"),
      description: "",
    },
    liquidity: {
      title: t("navigation.liquidity.title"),
      description: "",
    },
    myLiquidity: {
      title: t("navigation.myLiquidity.title"),
      description: "",
    },
    pools: {
      title: t("navigation.pools.title"),
      description: "",
    },
    portfolio: {
      title: t("navigation.portfolio.title"),
      description: "",
    },
    portfolioOverview: {
      title: t("navigation.portfolioOverview.title"),
      description: t("navigation.portfolioOverview.description"),
    },
    portfolioTracked: {
      title: t("navigation.portfolioTracked.title"),
      description: t("navigation.portfolioTracked.description"),
    },
    crossChain: {
      title: t("navigation.crossChain.title"),
      description: "",
    },
    crossChainHistory: {
      title: t("navigation.crossChainHistory.title"),
      description: t("navigation.crossChainHistory.description"),
    },
    trade: {
      title: t("navigation.trade.title"),
      description: "",
    },
    swap: {
      title: t("navigation.swap.title"),
      description: t("navigation.swap.description"),
    },
    swapMarket: {
      title: t("navigation.swapMarket.title"),
      description: "",
    },
    swapDca: {
      title: t("navigation.swapDca.title"),
      description: "",
    },
    otc: {
      title: t("navigation.otc.title"),
      description: t("navigation.otc.description"),
    },
    // stats: {
    //   title: t("navigation.stats.title"),
    //   description: t("navigation.stats.description"),
    // },
    // statsOverview: {
    //   title: t("navigation.statsOverview.title"),
    //   description: "",
    // },
    // statsTreasury: {
    //   title: t("navigation.statsTreasury.title"),
    //   description: "",
    // },
    staking: {
      title: t("navigation.staking.title"),
      description: t("navigation.staking.description"),
    },
    stakingOld: {
      title: t("navigation.stakingOld.title"),
      description: t("navigation.staking.description"),
    },
    stakingGigaStake: {
      title: t("navigation.stakingGigaStake.title"),
      description: t("navigation.staking.description"),
    },
    borrow: {
      title: t("navigation.borrow.title"),
      description: "",
    },
    borrowDashboard: {
      title: t("navigation.borrowDashboard.title"),
      description: t("navigation.borrowDashboard.description"),
    },
    borrowMarkets: {
      title: t("navigation.borrowMarkets.title"),
      description: t("navigation.borrowMarkets.description"),
    },
    borrowHistory: {
      title: t("navigation.borrowHistory.title"),
      description: t("navigation.borrowHistory.description"),
    },
    stats: {
      title: t("navigation.stats.title"),
      description: "",
    },
    statsOverview: {
      title: t("navigation.statsOverview.title"),
      description: "",
    },
    statsTreasury: {
      title: t("navigation.statsTreasury.title"),
      description: "",
    },
    statsMoneyMarket: {
      title: t("navigation.statsMoneyMarket.title"),
      description: "",
    },
    statsHollar: {
      title: t("navigation.statsHollar.title"),
      description: "",
    },
    statsAmm: {
      title: t("navigation.statsAmm.title"),
      description: "",
    },
    statsFees: {
      title: t("navigation.statsFees.title"),
      description: "",
    },
    strategies: {
      title: t("navigation.strategies.title"),
      description: "",
    },
    strategiesBil: {
      title: t("navigation.strategiesBil.title"),
      description: t("navigation.strategiesBil.description"),
    },
    strategiesHollarBonds: {
      title: t("navigation.strategiesHollarBonds.title"),
      description: t("navigation.strategiesHollarBonds.description"),
    },
    deposit: {
      title: t("navigation.deposit.title"),
      description: t("navigation.deposit.description"),
    },
    withdraw: {
      title: t("navigation.withdraw.title"),
      description: t("navigation.withdraw.description"),
    },
    submitTransaction: {
      title: t("navigation.submitTransaction.title"),
      description: "",
    },
    explorer: {
      title: t("navigation.explorer.title"),
      description: "",
    },
  }) satisfies Record<NavigationKey, { title: string; description: string }>

export const getPageMeta = (navKey: NavigationKey, t: TFunction) => {
  const previewId = getDeployPreviewId()
  const translations = getMenuTranslations(t)

  const { title, description } = translations[navKey]
  const globalTitle = t("meta.title")
  const fullTitle = title ? `${title} | ${globalTitle}` : globalTitle

  if (previewId) {
    return [
      {
        title: `${previewId} | ${fullTitle}`,
      },
    ]
  }
  return [
    {
      title: fullTitle,
    },
    {
      name: "description",
      content: description || t("meta.description"),
    },
  ]
}

export const topNavOrder: ReadonlyArray<NavigationKey> = [
  "trade",
  "borrow",
  "strategies",
  "liquidity",
  "portfolio",
  "crossChain",
  "stats",
  "staking",
  "explorer",
]
export const bottomNavOrder: ReadonlyArray<NavigationKey> = [
  "portfolio",
  "trade",
  "liquidity",
  "borrow",
  "strategies",
  "crossChain",
  "stats",
  "staking",
  "explorer",
]

export const NAV_ITEMS_SHOWN_MOBILE = 4
export const NAV_ITEMS_SHOWN_TABLET = 5
