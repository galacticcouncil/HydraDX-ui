import { Stack } from "@galacticcouncil/ui/components"
import { safeConvertSS58toH160 } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { Navigate } from "@tanstack/react-router"
import { useState } from "react"
import { type Hex } from "viem"

import { TwoColumnGrid } from "@/modules/layout/components/TwoColumnGrid/TwoColumnGrid"
import { AboutCard } from "@/modules/strategies/propeller/components/AboutCard"
import { DepositPanel } from "@/modules/strategies/propeller/components/DepositPanel"
import { MyPositionsCard } from "@/modules/strategies/propeller/components/MyPositionsCard"
import { StrategyDetailsCard } from "@/modules/strategies/propeller/components/StrategyDetailsCard"
import { StrategyHeader } from "@/modules/strategies/propeller/components/StrategyHeader"
import type { WithdrawalRow } from "@/modules/strategies/propeller/components/Withdrawals.columns"
import { WithdrawalsCard } from "@/modules/strategies/propeller/components/WithdrawalsCard"
import { WithdrawModal } from "@/modules/strategies/propeller/components/WithdrawModal"
import { type PropellerVaultConfig } from "@/modules/strategies/propeller/config/vaults"
import { PropellerVaultProvider } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { useRedemptionHistory } from "@/modules/strategies/propeller/hooks/useRedemptionHistory"
import { useRedemptionQueue } from "@/modules/strategies/propeller/hooks/useRedemptionQueue"
import {
  useLoopPosition,
  usePropellerApy,
  useSubLoopStats,
  useUserBalances,
  useVaultStats,
} from "@/modules/strategies/propeller/hooks/useVaultReads"
import {
  useClaim,
  useDeposit,
  useRequestRedeem,
} from "@/modules/strategies/propeller/hooks/useVaultWrites"
import { useRpcProvider } from "@/providers/rpcProvider"

export const PropellerVaultPage = ({
  vault,
}: {
  vault: PropellerVaultConfig
}) => {
  const { featureFlags, isReady } = useRpcProvider()

  if (isReady && !featureFlags.propellerEnabled) {
    return <Navigate to="/strategies" />
  }

  return (
    <PropellerVaultProvider vault={vault}>
      <PropellerVaultContent />
    </PropellerVaultProvider>
  )
}

const PropellerVaultContent = () => {
  const { account } = useAccount()
  const [showRedeemed, setShowRedeemed] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  const address = account?.address ?? ""
  const evmAddress = address
    ? (safeConvertSS58toH160(address) as Hex)
    : undefined

  const { data: vaultStats } = useVaultStats()
  const apy = usePropellerApy()
  const { data: balances } = useUserBalances(evmAddress)
  const { data: queueData } = useRedemptionQueue(evmAddress)
  const { data: settlementData } = useRedemptionHistory(evmAddress)
  const { data: loopPosition } = useLoopPosition()
  const { data: subLoop } = useSubLoopStats()

  const depositMutation = useDeposit()
  const redeemMutation = useRequestRedeem()
  const claimMutation = useClaim()

  const isPending =
    depositMutation.isPending ||
    redeemMutation.isPending ||
    claimMutation.isPending

  const stats = vaultStats ?? {
    totalAssets: 0,
    totalSupply: 0,
    exchangeRate: 1,
    queueLength: 0,
    tvlCap: 0,
    paused: false,
    depositsPaused: false,
    minRedeem: 0,
    apr: 0,
  }

  const userBalances = balances ?? { eth: 0, shares: 0 }
  const queue = queueData?.queue ?? []

  const settlementByReqId = new Map(
    (settlementData ?? []).map((s) => [s.requestId, s]),
  )

  const carry = subLoop?.negativeCarry ?? 0

  const withdrawalRows: WithdrawalRow[] = queue
    .filter((e) => e.isUser)
    .map((e) => {
      const settlement = settlementByReqId.get(e.requestId)
      const state: WithdrawalRow["state"] = !e.active
        ? "claimed"
        : e.settledProgress >= 1
          ? "settled"
          : e.settledProgress > 0
            ? "partial"
            : "pending"

      const settledSoFar = settlement?.collateralSettled ?? 0
      const hasSettled = settledSoFar > 0
      return {
        id: e.requestId,
        amountShares: e.shares,
        estEth: hasSettled
          ? settledSoFar
          : e.collateralOwed > 0
            ? e.collateralOwed * (1 - carry)
            : e.shares * stats.exchangeRate * (1 - carry),
        isEstimate: !hasSettled,
        state,
        settledDate: settlement?.firstSettledAt,
        collateralOwed: e.collateralOwed,
        collateralSettled: e.collateralSettled,
        settledSoFar,
        willSettleShort:
          e.active &&
          e.settledProgress < 1 &&
          loopPosition?.pendingUnwind === 0n,
      }
    })

  const hasPositions = userBalances.shares > 0

  return (
    <Stack gap="xxl">
      <StrategyHeader />

      <TwoColumnGrid template="sidebar">
        <Stack gap="xl" sx={{ order: [1, null, 0] }}>
          {hasPositions && (
            <MyPositionsCard
              shares={userBalances.shares}
              exchangeRate={stats.exchangeRate}
              apy={apy}
              onWithdraw={() => setShowWithdraw(true)}
            />
          )}

          <WithdrawalsCard
            rows={withdrawalRows}
            showRedeemed={showRedeemed}
            onShowRedeemedChange={setShowRedeemed}
            onClaim={(requestId) => claimMutation.mutate(requestId)}
            isClaiming={claimMutation.isPending}
          />

          <StrategyDetailsCard vaultStats={stats} />

          <AboutCard />
        </Stack>

        <DepositPanel
          vaultStats={stats}
          balances={userBalances}
          onDeposit={(amount) => depositMutation.mutate(amount)}
          isPending={isPending}
        />
      </TwoColumnGrid>

      <WithdrawModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        vaultStats={stats}
        shareBalance={userBalances.shares}
        loopEquity={loopPosition?.equity ?? null}
        negativeCarry={subLoop?.negativeCarry ?? null}
        onRequestRedeem={(amount) => {
          redeemMutation.mutate(amount)
          setShowWithdraw(false)
        }}
        isPending={isPending}
      />
    </Stack>
  )
}
