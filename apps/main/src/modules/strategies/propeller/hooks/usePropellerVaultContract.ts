import { queryOptions, useQuery } from "@tanstack/react-query"
import { getContract, type Hex } from "viem"

import { VAULT_ABI } from "@/modules/strategies/propeller/config/abi"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"
import { TProviderContext, useRpcProvider } from "@/providers/rpcProvider"

export const propellerVaultContractQuery = (
  rpc: TProviderContext,
  vaultAddress: Hex,
) => {
  return queryOptions({
    queryKey: ["propeller-vault-contract", vaultAddress],
    enabled: rpc.isReady,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () => {
      return getContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        client: rpc.evm,
      })
    },
  })
}
export const usePropellerVaultContract = () => {
  const rpc = useRpcProvider()
  const { vaultAddress } = useActivePropellerVault()
  return useQuery(propellerVaultContractQuery(rpc, vaultAddress))
}
