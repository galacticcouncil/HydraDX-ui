import { chainsMap } from "@galacticcouncil/xc-cfg"
import { useQuery } from "@tanstack/react-query"
import { UseFormReturn } from "react-hook-form"

import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"

export const xcDestBalanceQueryKey = (chainKey: string, address: string) =>
  ["xcSwap", "destBalance", chainKey, address] as const

type UseXcDestBalanceParams = {
  form: UseFormReturn<XcSwapFormValues>
}

export const useXcDestBalance = ({ form }: UseXcDestBalanceParams) => {
  const [destChain, destAddress] = form.watch(["destChain", "destAddress"])

  const [debouncedAddress] = useDebouncedValue(destAddress)

  const address = debouncedAddress.trim()
  // zec has no balance reader configured, so it never fetches
  const chain =
    destChain?.platform === "near" && destChain.addressValidator(address)
      ? chainsMap.get(destChain.key)
      : undefined

  const { data, isLoading } = useQuery({
    enabled: !!chain,
    queryKey: xcDestBalanceQueryKey(destChain?.key ?? "", address),
    queryFn: async () => {
      if (!chain) throw new Error("Destination chain is required")

      const asset = chain.getAssets()[0]

      if (!asset) throw new Error(`No asset configured on ${chain.key}`)

      return chain.getBalance(asset, address)
    },
  })

  return { balance: data?.toDecimal(), isLoading }
}
