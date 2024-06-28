import { useAcountAssets } from "api/assetDetails"
import BigNumber from "bignumber.js"
import { useShallow } from "hooks/useShallow"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useSettingsStore } from "state/store"
import { maxBalance, required } from "utils/validators"
import { ZodType, z } from "zod"

export type CreateXYKPoolFormData = {
  assetA: string
  assetB: string
}

export const createXYKPoolFormSchema = (
  balanceA: BigNumber,
  decimalsA: number,
  balanceB: BigNumber,
  decimalsB: number,
): ZodType<CreateXYKPoolFormData> =>
  z.object({
    assetA: required.pipe(maxBalance(balanceA, decimalsA)),
    assetB: required.pipe(maxBalance(balanceB, decimalsB)),
  })

export const createPoolExclusivityMap = (xykPoolsAssets: string[][]) => {
  return xykPoolsAssets.reduce<Record<string, string[]>>((memo, [idA, idB]) => {
    if (!memo[idA]) {
      memo[idA] = []
    }
    if (!memo[idB]) {
      memo[idB] = []
    }
    if (!memo[idA].includes(idB)) {
      memo[idA].push(idB)
    }
    if (!memo[idB].includes(idA)) {
      memo[idB].push(idA)
    }
    return memo
  }, {})
}

export const filterIdsByExclusivity = (
  exclusiveId: string,
  ids: string[],
  map: Record<string, string[]>,
) => ids.filter((id) => id !== exclusiveId && !map[exclusiveId]?.includes(id))

export const useAllowedXYKPoolAssets = () => {
  const { account } = useAccount()
  const { assets } = useRpcProvider()
  const degenMode = useSettingsStore(useShallow((s) => s.degenMode))

  const { isAdded } = useUserExternalTokenStore()

  const accountAssets = useAcountAssets(account?.address)

  return useMemo(() => {
    const tradableAssetIds = assets.tradeAssets.map((asset) => asset.id)
    const accountAssetIds = accountAssets
      .filter(({ balance }) => balance.freeBalance.gt(0))
      .map(({ asset }) => asset.id)

    return assets.all.filter((asset) => {
      const isTradable = tradableAssetIds.includes(asset.id)
      const hasBalance = accountAssetIds.includes(asset.id)
      const isNotTradableWithBalance = !isTradable && hasBalance

      const shouldBeVisible = isTradable || isNotTradableWithBalance

      if (asset.isExternal) {
        return shouldBeVisible && (degenMode || isAdded(asset.externalId))
      }

      return shouldBeVisible
    })
  }, [degenMode, accountAssets, assets.all, assets.tradeAssets, isAdded])
}
