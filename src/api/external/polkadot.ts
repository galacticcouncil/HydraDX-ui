import { useQuery } from "@tanstack/react-query"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { QUERY_KEYS } from "utils/queryKeys"

type TRegistryChain = {
  assetCnt: string
  id: string
  paraID: number
  relayChain: "polkadot" | "kusama"
  data: (TExternalAsset & { currencyID: string })[]
}

export const usePolkadotRegistry = () => {
  return useQuery(QUERY_KEYS.polkadotRegistry, async () => {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/colorfulnotion/xcm-global-registry/metadata/xcmgar.json",
    )
    const data = await res.json()
    let polkadotAssets: TRegistryChain[] = []

    try {
      polkadotAssets = data?.assets?.polkadot ?? []
    } catch (error) {}

    return polkadotAssets
  })
}
