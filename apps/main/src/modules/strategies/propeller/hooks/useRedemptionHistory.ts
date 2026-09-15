import { useQuery } from "@tanstack/react-query"
import { formatUnits, type Hex, parseAbiItem } from "viem"

import { VAULT_DEPLOY_BLOCK } from "@/modules/strategies/propeller/constants"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

// Only RedeemSettled shows up in eth_getLogs. User vault calls go through
// pallet-evm, not native Ethereum txs, so Deposited / RedeemRequested / Claimed
// never appear. Keeper settlements do.
const SETTLED_EVENT = parseAbiItem(
  "event RedeemSettled(uint256 indexed requestId, uint256 collateral)",
)

export interface RedemptionSettlement {
  requestId: number
  /** Collateral released across all settlement tranches; only recorded here. */
  collateralSettled: number
  firstSettledAt: Date
  lastSettledAt: Date
}

/** Measured payout totals and settlement timestamps by requestId. */
export function useRedemptionHistory(evmAddress: Hex | undefined) {
  const { evm } = useRpcProvider()
  const { getAssetWithFallback } = useAssets()
  const { vaultAddress, assetId } = useActivePropellerVault()
  const decimals = getAssetWithFallback(assetId).decimals
  return useQuery({
    queryKey: ["propeller-vault-settlements", vaultAddress, assetId],
    enabled: !!evmAddress,
    queryFn: async (): Promise<RedemptionSettlement[]> => {
      const logs = await evm.getLogs({
        address: vaultAddress,
        fromBlock: VAULT_DEPLOY_BLOCK,
        event: SETTLED_EVENT,
      })

      const uniqueBlockHashes = [
        ...new Set(logs.map((l) => l.blockHash).filter((h): h is Hex => !!h)),
      ]
      const blocks = await Promise.all(
        uniqueBlockHashes.map((blockHash) => evm.getBlock({ blockHash })),
      )
      const tsByBlock = new Map<Hex, Date>()
      for (const b of blocks) {
        if (b.hash) tsByBlock.set(b.hash, new Date(Number(b.timestamp) * 1000))
      }

      const byId = new Map<bigint, RedemptionSettlement>()
      for (const l of logs) {
        const requestId = l.args.requestId!
        const ts = l.blockHash ? tsByBlock.get(l.blockHash) : undefined
        // _retireExhaustedHead can emit RedeemSettled(id, 0) with no collateral.
        const collateral = Number(formatUnits(l.args.collateral!, decimals))
        const entry = byId.get(requestId)
        if (!entry) {
          byId.set(requestId, {
            requestId: Number(requestId),
            collateralSettled: collateral,
            firstSettledAt: ts ?? new Date(0),
            lastSettledAt: ts ?? new Date(0),
          })
        } else {
          entry.collateralSettled += collateral
          if (ts) entry.lastSettledAt = ts
        }
      }

      return [...byId.values()]
    },
    refetchInterval: 30_000,
    staleTime: 30_000,
  })
}
