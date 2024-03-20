import { WalletPage } from "./sections/wallet/WalletPage"
import { Navigate, Route } from "@tanstack/react-location"
import { XcmPage } from "sections/xcm/XcmPage"
import { PoolsPage } from "sections/pools/PoolsPage"
import { StatsPage } from "sections/stats/StatsPage"
import { StakingPage } from "./sections/staking/StakingPage"
import { TradePage } from "sections/trade/TradePage"
import { SwapPage } from "sections/trade/sections/swap/SwapPage"
import { OtcPageWrapper } from "sections/trade/sections/otc/OtcPageWrappet"
import { DcaPage } from "sections/trade/sections/dca/DcaPage"
import { BondsPageWrapper } from "sections/trade/sections/bonds/BondsPageWrapper"
import { BondDetailsPage } from "sections/trade/sections/bonds/details/BondDetailsPage"
import { AllPools } from "sections/pools/sections/AllPools"
import { MyLiquidity } from "sections/pools/sections/MyLiquidity"
import { OmnipoolAndStablepool } from "sections/pools/sections/OmnipoolAndStablepool"
import { IsolatedPools } from "sections/pools/sections/IsolatedPools"
import { ReferralsWrapper } from "sections/referrals/ReferralsPage"
import { StatsPOL } from "sections/stats/sections/POL/StatsPOL"
import { StatsOverview } from "sections/stats/sections/overview/StatsOverview"
import { StatsOmnipoolAsset } from "sections/stats/sections/omnipoolAsset/StatsOmnipoolAsset"
import { BridgePage } from "sections/xcm/BridgePage"
import { YieldDcaPage } from "sections/trade/sections/yieldDca/YieldDcaPage"

const isDevelopment = import.meta.env.VITE_ENV === "development"

export const routes: Route[] = [
  {
    path: "/",
    element: <Navigate to="/trade/swap" />,
  },
  {
    path: "trade",
    element: <TradePage />,
    children: [
      {
        path: "/",
        element: <Navigate to="swap" />,
      },
      {
        path: "swap",
        element: <SwapPage />,
      },
      {
        path: "otc",
        element: <OtcPageWrapper />,
      },
      {
        path: "yield-dca",
        element: <YieldDcaPage />,
      },
      {
        path: "dca",
        element: <DcaPage />,
      },
      {
        path: "bond",
        element: <BondDetailsPage />,
      },
      {
        path: "bonds",
        element: <BondsPageWrapper />,
      },
    ],
  },
  {
    path: "wallet",
    children: [
      {
        path: "/",
        element: <Navigate to="assets" fromCurrent />,
      },
      {
        path: "assets",
        element: <WalletPage />,
      },
      {
        path: "vesting",
        element: <WalletPage />,
      },
      ...(isDevelopment
        ? [
            {
              path: "transactions",
              element: <WalletPage />,
            },
          ]
        : []),
    ],
  },
  {
    path: "liquidity",
    element: <PoolsPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="all-pools" />,
      },
      {
        path: "my-liquidity",
        element: <MyLiquidity />,
      },
      {
        path: "all-pools",
        element: <AllPools />,
      },
      {
        path: "omnipool-stablepools",
        element: <OmnipoolAndStablepool />,
      },
      {
        path: "isolated",
        element: <IsolatedPools />,
      },
    ],
  },
  {
    path: "cross-chain",
    element: <XcmPage />,
  },
  {
    path: "bridge",
    element: <BridgePage />,
  },
  {
    path: "stats",
    element: <StatsPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="overview" />,
      },
      {
        path: "overview",
        element: <StatsOverview />,
      },
      {
        path: "treasury",
        element: <StatsPOL />,
      },
      {
        path: "asset",
        element: <StatsOmnipoolAsset />,
      },

      // TODO: Not ready. Requested in #861n9ffe4
      // {
      //   path: "LRNA",
      //   element: <StatsPage />,
      // },
    ],
  },
  {
    path: "staking",
    element: <StakingPage />,
  },
  {
    path: "referrals",
    element: <ReferralsWrapper />,
  },
  {
    path: "lending",
    element: () =>
      import("./sections/lending/LendingPage").then((mod) => (
        <mod.LendingPage />
      )),
    children: [
      {
        path: "/",
        element: () =>
          import("./sections/lending/LendingDashboardPage").then((mod) => (
            <mod.LendingDashboardPage />
          )),
      },
      {
        path: "markets",
        element: () =>
          import("./sections/lending/LendingMarketsPage").then((mod) => (
            <mod.LendingMarketsPage />
          )),
      },
      {
        path: "reserve-overview",
        element: () =>
          import("./sections/lending/LendingReserveOverviewPage").then(
            (mod) => <mod.LendingReserveOverviewPage />,
          ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/trade" />,
  },
]
