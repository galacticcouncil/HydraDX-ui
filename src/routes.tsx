import { WalletPage } from "./sections/wallet/WalletPage"
import { Navigate } from "@tanstack/react-location"
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
import { StatsLRNA } from "sections/stats/sections/LRNA/StatsLRNA"

const isOtcPageEnabled = import.meta.env.VITE_FF_OTC_ENABLED === "true"
const isDcaPageEnabled = import.meta.env.VITE_FF_DCA_ENABLED === "true"
const isBondsPageEnabled = import.meta.env.VITE_FF_BONDS_ENABLED === "true"
const isXYKPageEnabled = import.meta.env.VITE_FF_XYK_ENABLED === "true"

export const routes = [
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
        ...(isOtcPageEnabled && {
          path: "otc",
          element: <OtcPageWrapper />,
        }),
      },
      {
        ...(isDcaPageEnabled && {
          path: "dca",
          element: <DcaPage />,
        }),
      },
      ...(isBondsPageEnabled
        ? [
            {
              path: "bond",
              element: <BondDetailsPage />,
            },
          ]
        : []),
      ...(isBondsPageEnabled
        ? [
            {
              path: "bonds",
              element: <BondsPageWrapper />,
            },
          ]
        : []),
    ],
  },
  {
    path: "wallet",
    children: [
      {
        path: "/",
        element: <Navigate to="assets" />,
      },
      {
        path: "assets",
        element: <WalletPage />,
      },
      {
        path: "vesting",
        element: <WalletPage />,
      },
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
      ...(isXYKPageEnabled
        ? [
            {
              path: "isolated",
              element: <IsolatedPools />,
            },
          ]
        : []),
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
      {
        path: "LRNA",
        element: <StatsLRNA />,
      },
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
    path: "*",
    element: <Navigate to="/trade" />,
  },
]
