import { useQuery } from "@tanstack/react-query"
import { formatUnits, type Hex } from "viem"

import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { usePropellerVaultContract } from "@/modules/strategies/propeller/hooks/usePropellerVaultContract"
import { useAssets } from "@/providers/assetsProvider"

export interface QueueEntry {
  requestId: number
  owner: string
  shares: number
  collateralOwed: number
  collateralSettled: number
  /**
   * Unwind progress from repaid/debtShare. Not collateralSettled: a claim
   * resets that to 0 mid-settlement.
   */
  settledProgress: number
  /** True until the owner claims. */
  active: boolean
  isUser: boolean
}

export function useRedemptionQueue(evmAddress: Hex | undefined) {
  const { data: vault } = usePropellerVaultContract()
  const { getAssetWithFallback } = useAssets()
  const { vaultAddress, assetId } = useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals
  return useQuery({
    enabled: !!vault && !!evmAddress,
    queryKey: ["propeller-vault-queue", vaultAddress, evmAddress, assetId],
    queryFn: async () => {
      if (!vault) throw new Error("Vault contract not found")

      const [tail, totalQueued] = await Promise.all([
        vault.read.queueTail(),
        vault.read.totalQueuedShares(),
      ])

      const queueTail = Number(tail)
      const totalQueuedShares = Number(formatUnits(totalQueued, decimals))

      const entries: QueueEntry[] = []
      const addr = evmAddress?.toLowerCase()

      // Scan from 0, not queueHead: settled-but-unclaimed requests sit below the head.
      for (let i = 0; i < queueTail; i++) {
        const [
          owner,
          shares,
          collateralOwed,
          debtShare,
          ,
          repaid,
          collateralSettled,
          ,
          active,
        ] = await vault.read.redemptions([BigInt(i)])

        if (owner === "0x0000000000000000000000000000000000000000") continue

        entries.push({
          requestId: i,
          owner,
          shares: Number(formatUnits(shares, decimals)),
          collateralOwed: Number(formatUnits(collateralOwed, decimals)),
          collateralSettled: Number(formatUnits(collateralSettled, decimals)),
          settledProgress:
            debtShare > 0n ? Number(repaid) / Number(debtShare) : 0,
          active,
          isUser: addr ? owner.toLowerCase() === addr : false,
        })
      }

      return {
        queue: entries,
        totalQueuedShares,
      }
    },
    refetchInterval: 30_000,
  })
}
