import { Account, useAccount } from "@galacticcouncil/web3-connect"
import { createRootRouteWithContext, HeadContent } from "@tanstack/react-router"
import { lazy, Suspense } from "react"

import { useAccountBalances } from "@/api/balances"
import { useInvalidateOnBlock, useReloadOnStaleBlocks } from "@/api/chain"
import { neckworkClient } from "@/api/neckwork"
import { useNeckworkSync } from "@/api/neckworkSync"
import { usePriceSubscriber } from "@/api/spotPrice"
import { RouterContext } from "@/App"
import { Footer } from "@/modules/layout/components/Footer"
import { LayoutSkeleton } from "@/modules/layout/components/LayoutSkeleton"
import { useHasTopNavbar } from "@/modules/layout/hooks/useHasTopNavbar"
import { MainLayout } from "@/modules/layout/MainLayout"
import { useXcScanSubscription } from "@/modules/xcm/history"
import { AssetRegistryGate } from "@/providers/AssetRegistryGate"
import { AssetsProvider } from "@/providers/assetsProvider"
import { MultisigProvider } from "@/providers/MultisigProvider"
import { RpcProvider, useRpcProvider } from "@/providers/rpcProvider"

const MobileTabBar = lazy(async () => ({
  default: await import(
    "@/modules/layout/components/MobileTabBar/MobileTabBar"
  ).then((m) => m.MobileTabBar),
}))

const TransactionManager = lazy(async () => ({
  default: await import("@/modules/transactions/TransactionManager").then(
    (m) => m.TransactionManager,
  ),
}))

const Web3ConnectModalV2 = lazy(async () => ({
  default: await import("@galacticcouncil/web3-connect").then(
    (m) => m.Web3ConnectModalV2,
  ),
}))

const Web3ConnectSession = lazy(async () => ({
  default: await import("@galacticcouncil/web3-connect").then(
    (m) => m.Web3ConnectSession,
  ),
}))

const Devtools = import.meta.env.DEV
  ? lazy(async () => ({
      default: await import("@/components/Devtools").then((m) => m.Devtools),
    }))
  : lazy(async () => ({ default: () => null }))

const RootPendingComponent = () => (
  <AssetsProvider>
    <LayoutSkeleton />
  </AssetsProvider>
)

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  pendingComponent: RootPendingComponent,
  head: ({
    match: {
      context: { i18n },
    },
  }) => ({
    meta: [
      {
        title: i18n.t("common:meta.title"),
      },
      {
        name: "description",
        content: i18n.t("common:meta.description"),
      },
    ],
  }),
})

function RootComponent() {
  const hasTopNavbar = useHasTopNavbar()

  return (
    <>
      <HeadContent />
      <AssetsProvider>
        <RpcProvider>
          <MultisigProvider>
            <AssetRegistryGate>
              <MainLayout />
              <Services />
              <Footer />
              {!hasTopNavbar && (
                <Suspense>
                  <MobileTabBar />
                </Suspense>
              )}
            </AssetRegistryGate>
          </MultisigProvider>
        </RpcProvider>
      </AssetsProvider>
      {hasTopNavbar && (
        <Suspense>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}

function ApiSubscriptions() {
  useInvalidateOnBlock()
  useReloadOnStaleBlocks()
  useNeckworkSync()
  useAccountBalances()
  usePriceSubscriber()

  return null
}

function AccountSubscriptions({ account }: { account: Account }) {
  useXcScanSubscription(account.address)

  return null
}

function Services() {
  const { isConnected, account } = useAccount()
  const { isReady, papi } = useRpcProvider()
  return (
    <>
      <Suspense fallback={null}>
        <TransactionManager />
        <Web3ConnectSession />
        <Web3ConnectModalV2 neckwork={neckworkClient} papi={papi} />
      </Suspense>
      {isReady && <ApiSubscriptions />}
      {isConnected && <AccountSubscriptions account={account} />}
    </>
  )
}
